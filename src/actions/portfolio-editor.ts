'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyJWT } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { loadPortfolio, type LoadedPortfolio } from '@/lib/portfolio/load';
import type { PortfolioData } from '@/lib/data/mockData';

async function getUserId() {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    return (payload?.sub as string | undefined) || null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isDbId = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);

/** "2024-06" or "2024-06-15" -> "2024-06-01"/"2024-06-15"; anything else -> null */
function toDate(month?: string | null): string | null {
    if (!month) return null;
    const m = String(month).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    return m ? `${m[1]}-${m[2]}-${m[3] || '01'}` : null;
}

const clean = (v?: string | null) => (v ?? '').trim();

function slugify(text: string) {
    return (text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50) || 'project')
        + '-' + Math.random().toString(36).slice(2, 7);
}

/** The signed-in user's portfolio, including hidden items, for the editor. */
export async function getMyPortfolio(): Promise<LoadedPortfolio | null> {
    const userId = await getUserId();
    if (!userId) return null;
    return loadPortfolio({ userId });
}

/**
 * Saves the editor's content. Rows are updated in place (keeping GitHub links,
 * import sources and dates), new items are inserted and removed items deleted.
 * Edited text is marked as user-edited so AI regeneration will not overwrite it.
 */
export async function saveMyPortfolio(input: {
    data: PortfolioData;
    template: string;
    theme: string;
    font: string;
}): Promise<{ success: true } | { error: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'Please sign in again.' };

    const supabase = createServiceClient() as any;
    const { data: portfolio } = await supabase.from('portfolios').select('id, subdomain').eq('user_id', userId).maybeSingle();
    if (!portfolio) return { error: 'No portfolio yet. Connect a data source and generate it first.' };

    const pid = portfolio.id;
    const d = input.data;
    const now = new Date().toISOString();
    const errors: string[] = [];
    const check = (label: string) => ({ error }: { error: any }) => { if (error) errors.push(`${label}: ${error.message}`); };

    // ── Profile ────────────────────────────────────────────────────────
    const githubUser = clean(d.socials.github).replace(/^https?:\/\/(www\.)?github\.com\//i, '').split(/[/?#]/)[0];
    await supabase.from('users').update({
        full_name: clean(d.name) || null,
        avatar_url: clean(d.avatarUrl) || null,
        github_username: githubUser || null,
        linkedin_url: clean(d.socials.linkedin) || null,
        updated_at: now,
    }).eq('id', userId).then(check('Profile'));

    await supabase.from('portfolio_content').delete().eq('portfolio_id', pid).eq('section_type', 'about');
    await supabase.from('portfolio_content').insert({
        portfolio_id: pid,
        section_type: 'about',
        content: clean(d.bio),
        user_edited: true,
        metadata: {
            hero_tagline: clean(d.title),
            location: clean(d.location),
            phone: clean(d.phone),
            website: clean(d.website),
            twitter: clean(d.socials.twitter),
            show_email: d.showEmail !== false,
            show_phone: d.showPhone === true,
        },
    }).then(check('About'));

    await supabase.from('portfolios').update({
        template_id: input.template,
        color_scheme: { primary: input.theme, font: input.font },
        updated_at: now,
    }).eq('id', pid).then(check('Design'));

    // ── Projects ───────────────────────────────────────────────────────
    const { data: dbProjects } = await supabase.from('projects').select('id').eq('portfolio_id', pid);
    const keepProjects = new Set<string>();
    for (const [i, p] of d.projects.entries()) {
        if (!clean(p.title)) continue;
        const row = {
            title: clean(p.title),
            short_description: clean(p.description),
            technologies: p.tags.map(t => t.trim()).filter(Boolean),
            demo_url: clean(p.link) || null,
            repo_url: clean(p.repoUrl) || null,
            is_visible: p.visible !== false,
            display_order: i,
            updated_at: now,
        };
        if (isDbId(p.id)) {
            keepProjects.add(p.id);
            await supabase.from('projects').update(row).eq('id', p.id).eq('portfolio_id', pid).then(check(`Project "${row.title}"`));
        } else {
            await supabase.from('projects').insert({ ...row, portfolio_id: pid, slug: slugify(row.title), source: 'manual' })
                .then(check(`Project "${row.title}"`));
        }
    }
    const dropProjects = (dbProjects || []).map((r: any) => r.id).filter((id: string) => !keepProjects.has(id));
    if (dropProjects.length) await supabase.from('projects').delete().in('id', dropProjects).then(check('Removing projects'));

    // ── Experience ─────────────────────────────────────────────────────
    const { data: dbExp } = await supabase.from('experiences').select('id').eq('portfolio_id', pid);
    const keepExp = new Set<string>();
    for (const [i, e] of d.experience.entries()) {
        if (!clean(e.role) || !clean(e.company)) continue;
        const row = {
            role: clean(e.role),
            company: clean(e.company),
            location: clean(e.location) || null,
            description: clean(e.description),
            start_date: toDate(e.startDate) || new Date().toISOString().slice(0, 10),
            end_date: e.isCurrent ? null : toDate(e.endDate),
            is_current: !!e.isCurrent,
            is_visible: e.visible !== false,
            display_order: i,
            updated_at: now,
        };
        if (isDbId(e.id)) {
            keepExp.add(e.id);
            await supabase.from('experiences').update(row).eq('id', e.id).eq('portfolio_id', pid).then(check(`Experience "${row.role}"`));
        } else {
            await supabase.from('experiences').insert({ ...row, portfolio_id: pid }).then(check(`Experience "${row.role}"`));
        }
    }
    const dropExp = (dbExp || []).map((r: any) => r.id).filter((id: string) => !keepExp.has(id));
    if (dropExp.length) await supabase.from('experiences').delete().in('id', dropExp).then(check('Removing experience'));

    // ── Education ──────────────────────────────────────────────────────
    const { data: dbEdu } = await supabase.from('education').select('id').eq('portfolio_id', pid);
    const keepEdu = new Set<string>();
    for (const [i, e] of (d.education || []).entries()) {
        if (!clean(e.institution)) continue;
        const row = {
            institution: clean(e.institution),
            degree: clean(e.degree) || 'Studies',
            field_of_study: clean(e.field) || null,
            grade: clean(e.grade) || null,
            start_date: toDate(e.startDate),
            end_date: toDate(e.endDate),
            display_order: i,
        };
        if (isDbId(e.id)) {
            keepEdu.add(e.id);
            await supabase.from('education').update(row).eq('id', e.id).eq('portfolio_id', pid).then(check(`Education "${row.institution}"`));
        } else {
            await supabase.from('education').insert({ ...row, portfolio_id: pid, is_visible: true }).then(check(`Education "${row.institution}"`));
        }
    }
    const dropEdu = (dbEdu || []).map((r: any) => r.id).filter((id: string) => !keepEdu.has(id));
    if (dropEdu.length) await supabase.from('education').delete().in('id', dropEdu).then(check('Removing education'));

    // ── Skills (matched by name, case-insensitive) ─────────────────────
    const wanted = new Map<string, { name: string; category: string; order: number }>();
    ([['Frontend', d.skills.frontend], ['Backend', d.skills.backend], ['Tools', d.skills.tools]] as const).forEach(([category, list]) =>
        list.forEach((raw, order) => {
            const name = raw.trim();
            if (name && !wanted.has(name.toLowerCase())) wanted.set(name.toLowerCase(), { name, category, order });
        }));
    const { data: dbSkills } = await supabase.from('skills').select('id, skill_name').eq('portfolio_id', pid);
    const seen = new Set<string>();
    for (const s of dbSkills || []) {
        const key = String(s.skill_name).toLowerCase();
        const w = wanted.get(key);
        if (!w || seen.has(key)) {
            await supabase.from('skills').delete().eq('id', s.id);
        } else {
            seen.add(key);
            await supabase.from('skills').update({ skill_name: w.name, category: w.category, display_order: w.order, is_visible: true }).eq('id', s.id);
        }
    }
    const newSkills = [...wanted.entries()].filter(([key]) => !seen.has(key))
        .map(([, w]) => ({ portfolio_id: pid, skill_name: w.name, category: w.category, display_order: w.order }));
    if (newSkills.length) await supabase.from('skills').insert(newSkills).then(check('Adding skills'));

    revalidatePath(`/portfolio/${portfolio.subdomain}`);

    if (errors.length) {
        console.error('saveMyPortfolio errors:', errors);
        return { error: `Saved with problems: ${errors.slice(0, 2).join('; ')}` };
    }
    return { success: true };
}
