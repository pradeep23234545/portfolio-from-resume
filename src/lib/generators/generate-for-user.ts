import { createServiceClient } from '@/lib/supabase/service';
import { geminiPro, assertGeminiConfigured } from '@/lib/ai/gemini';

export type GenerateResult =
    | {
        success: true;
        subdomain: string;
        stats: { projects: number; experiences: number; skills: number; descriptionsWritten: number };
        warnings: string[];
    }
    | { success: false; error: string };

const SKILL_CATEGORIES = ['Frontend', 'Backend', 'Tools'] as const;

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'portfolio';
}

/** Ask Gemini for JSON and parse it, tolerating ```json fences or extra text. */
async function askJson<T>(prompt: string): Promise<T> {
    const result = await geminiPro.generateContent(prompt);
    const text: string = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('The AI did not return valid JSON. Please try again.');
    return JSON.parse(match[0]) as T;
}

async function getOrCreatePortfolio(supabase: any, userId: string, user: { email?: string; github_username?: string }) {
    const { data: existing } = await supabase
        .from('portfolios')
        .select('id, subdomain')
        .eq('user_id', userId)
        .maybeSingle();
    if (existing) return existing as { id: string; subdomain: string };

    const base = slugify(user.github_username || user.email?.split('@')[0] || `user-${userId.slice(0, 8)}`);
    for (const subdomain of [base, `${base}-${Math.floor(Math.random() * 10000)}`]) {
        const { data, error } = await supabase
            .from('portfolios')
            .insert({ user_id: userId, subdomain, template_id: 'modern' })
            .select('id, subdomain')
            .maybeSingle();
        if (!error) return data as { id: string; subdomain: string };
        if (error.code !== '23505') throw new Error(`Failed to create portfolio: ${error.message}`);
    }
    throw new Error('Failed to create portfolio');
}

/**
 * Builds the user's portfolio from their imported data:
 *  1. writes the About section, hero tagline, location and SEO description
 *  2. writes short descriptions for projects that have none and sorts skills
 *     into Frontend / Backend / Tools
 *  3. publishes the portfolio
 */
export async function generatePortfolioForUser(userId: string): Promise<GenerateResult> {
    try {
        assertGeminiConfigured();
        const supabase = createServiceClient() as any;

        const { data: user } = await supabase
            .from('users')
            .select('full_name, email, github_username')
            .eq('id', userId)
            .single();
        if (!user) return { success: false, error: 'User not found. Please sign in again.' };

        const portfolio = await getOrCreatePortfolio(supabase, userId, user);

        const [{ data: projects }, { data: experiences }, { data: skills }, { data: education }] = await Promise.all([
            supabase.from('projects').select('id, title, short_description, technologies, repo_url').eq('portfolio_id', portfolio.id).eq('is_visible', true),
            supabase.from('experiences').select('company, role, location, description, start_date, end_date, is_current').eq('portfolio_id', portfolio.id).eq('is_visible', true),
            supabase.from('skills').select('id, skill_name, category').eq('portfolio_id', portfolio.id),
            supabase.from('education').select('institution, degree, field_of_study, end_date').eq('portfolio_id', portfolio.id),
        ]);

        const p = projects || [], ex = experiences || [], sk = skills || [], ed = education || [];
        if (!p.length && !ex.length && !sk.length) {
            return {
                success: false,
                error: 'There is no data to build from yet. Connect GitHub or upload your resume on the Connect page first.',
            };
        }

        const warnings: string[] = [];

        // ── 1. About section, tagline, SEO ─────────────────────────────
        const about = await askJson<{
            about_me: string;
            hero_tagline: string;
            location?: string;
            meta_description: string;
        }>(`
You write portfolio websites for developers. Using ONLY the facts below, write content for ${user.full_name || 'this developer'}.
Do not invent employers, degrees, numbers or achievements that are not in the data.

EXPERIENCE: ${JSON.stringify(ex)}
EDUCATION: ${JSON.stringify(ed)}
PROJECTS: ${JSON.stringify(p.slice(0, 12).map((x: any) => ({ title: x.title, description: x.short_description, tech: x.technologies })))}
SKILLS: ${sk.map((s: any) => s.skill_name).join(', ')}

Return ONLY JSON:
{
  "about_me": "First-person About Me, 90-140 words, warm and specific, no buzzword lists",
  "hero_tagline": "Short role headline, max 8 words, e.g. 'Full-Stack Developer & CS Student'",
  "location": "City, Country if clearly stated in the data, otherwise empty string",
  "meta_description": "SEO description, 140-160 characters"
}`);

        // Replace the previous AI-written About section (keep it if the user edited it)
        const { data: oldAbout } = await supabase
            .from('portfolio_content')
            .select('id, user_edited')
            .eq('portfolio_id', portfolio.id)
            .eq('section_type', 'about');
        const userEdited = (oldAbout || []).some((r: any) => r.user_edited);
        if (!userEdited) {
            await supabase.from('portfolio_content').delete().eq('portfolio_id', portfolio.id).eq('section_type', 'about');
            const { error } = await supabase.from('portfolio_content').insert({
                portfolio_id: portfolio.id,
                section_type: 'about',
                content: about.about_me,
                ai_generated_content: about.about_me,
                metadata: { hero_tagline: about.hero_tagline, location: about.location || '' },
            });
            if (error) warnings.push(`Could not save About section: ${error.message}`);
        }

        // ── 2. Project descriptions + skill categories ─────────────────
        const needDescription = p.filter((x: any) => !x.short_description?.trim()).slice(0, 10);
        let descriptionsWritten = 0;
        try {
            const extra = await askJson<{
                projects: { id: string; description: string }[];
                skills: { id: string; category: string }[];
            }>(`
For a developer portfolio, return ONLY JSON with two lists.

1. "projects": for each project below, a 1-2 sentence description (max 30 words) of what it is,
   based on its name and technologies. Be modest and factual; do not invent features or metrics.
PROJECTS: ${JSON.stringify(needDescription.map((x: any) => ({ id: x.id, name: x.title, tech: x.technologies, url: x.repo_url })))}

2. "skills": put each skill into exactly one category: "Frontend", "Backend" or "Tools"
   (languages like Python/Java/C++ and databases go in "Backend"; UI frameworks, HTML/CSS in "Frontend";
   everything else, including soft skills, in "Tools").
SKILLS: ${JSON.stringify(sk.map((s: any) => ({ id: s.id, name: s.skill_name })))}

{ "projects": [{ "id": "...", "description": "..." }], "skills": [{ "id": "...", "category": "Frontend" }] }`);

            const projectIds = new Set(needDescription.map((x: any) => x.id));
            for (const item of extra.projects || []) {
                if (!projectIds.has(item.id) || !item.description?.trim()) continue;
                const { error } = await supabase.from('projects')
                    .update({ short_description: item.description.trim(), updated_at: new Date().toISOString() })
                    .eq('id', item.id);
                if (!error) descriptionsWritten++;
            }

            const skillIds = new Set(sk.map((s: any) => s.id));
            const byCategory: Record<string, string[]> = {};
            for (const item of extra.skills || []) {
                const cat = SKILL_CATEGORIES.find(c => c.toLowerCase() === String(item.category).toLowerCase());
                if (cat && skillIds.has(item.id)) (byCategory[cat] ||= []).push(item.id);
            }
            for (const [category, ids] of Object.entries(byCategory)) {
                await supabase.from('skills').update({ category }).in('id', ids);
            }
        } catch (error) {
            warnings.push(`Skipped project descriptions/skill grouping: ${error instanceof Error ? error.message : error}`);
        }

        // ── 3. Publish ─────────────────────────────────────────────────
        const now = new Date().toISOString();
        const { error: publishError } = await supabase.from('portfolios').update({
            seo_title: `${user.full_name || 'Portfolio'} — ${about.hero_tagline}`,
            seo_description: about.meta_description,
            is_published: true,
            published_at: now,
            last_synced_at: now,
            updated_at: now,
        }).eq('id', portfolio.id);
        if (publishError) warnings.push(`Could not publish: ${publishError.message}`);

        return {
            success: true,
            subdomain: portfolio.subdomain,
            stats: { projects: p.length, experiences: ex.length, skills: sk.length, descriptionsWritten },
            warnings,
        };
    } catch (error) {
        console.error('Portfolio generation failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
    }
}
