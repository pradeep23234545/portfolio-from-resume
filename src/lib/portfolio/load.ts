import { createServiceClient } from '@/lib/supabase/service';
import type { PortfolioData } from '@/lib/data/mockData';

export interface LoadedPortfolio {
    id: string;
    subdomain: string;
    isPublic: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    template: string;
    theme: string;
    font: string;
    data: PortfolioData;
}

/** "2024-06-01" -> "2024-06" (for month inputs) */
const toMonth = (date?: string | null) => (date ? String(date).slice(0, 7) : '');

import { formatPeriod } from './period';

function parseTags(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return [];
}

/**
 * Loads a portfolio and turns it into the shape templates and the editor use.
 * Hidden projects/experiences are included with `visible: false`;
 * call `onlyVisible()` before showing it to visitors.
 */
export async function loadPortfolio(where: { userId: string } | { subdomain: string }): Promise<LoadedPortfolio | null> {
    const supabase = createServiceClient() as any;

    let query = supabase
        .from('portfolios')
        .select('*, users (full_name, email, avatar_url, github_username, linkedin_url)');
    query = 'userId' in where ? query.eq('user_id', where.userId) : query.eq('subdomain', where.subdomain);
    const { data: portfolio } = await query.maybeSingle();
    if (!portfolio) return null;

    const id = portfolio.id;
    const [{ data: skills }, { data: projects }, { data: experiences }, { data: education }, { data: aboutRows }] = await Promise.all([
        supabase.from('skills').select('*').eq('portfolio_id', id).order('display_order', { ascending: true }),
        supabase.from('projects').select('*').eq('portfolio_id', id).order('display_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('experiences').select('*').eq('portfolio_id', id).order('start_date', { ascending: false }),
        supabase.from('education').select('*').eq('portfolio_id', id).order('end_date', { ascending: false, nullsFirst: true }),
        supabase.from('portfolio_content').select('content, metadata').eq('portfolio_id', id).eq('section_type', 'about').limit(1),
    ]);

    const user = portfolio.users || {};
    const about = aboutRows?.[0];
    const meta = (about?.metadata || {}) as Record<string, any>;
    const visibleSkills = (skills || []).filter((s: any) => s.is_visible !== false);
    const skillsIn = (...cats: string[]) =>
        visibleSkills.filter((s: any) => cats.includes(s.category)).map((s: any) => s.skill_name as string);

    const githubUser: string = user.github_username || '';
    const email: string = user.email || '';

    const data: PortfolioData = {
        name: user.full_name || 'Portfolio',
        email,
        title: meta.hero_tagline || experiences?.[0]?.role || 'Developer',
        bio: about?.content || portfolio.seo_description || '',
        location: meta.location || '',
        // Fall back to the GitHub profile picture when none was uploaded
        avatarUrl: user.avatar_url || (githubUser ? `https://github.com/${githubUser}.png` : ''),
        phone: meta.phone || '',
        website: meta.website || '',
        showEmail: meta.show_email !== false,
        showPhone: meta.show_phone === true,
        socials: {
            github: githubUser ? `https://github.com/${githubUser}` : '',
            linkedin: user.linkedin_url || '',
            email: email ? `mailto:${email}` : '',
            twitter: meta.twitter || '',
        },
        skills: {
            frontend: skillsIn('Frontend'),
            backend: skillsIn('Backend'),
            tools: skillsIn('Tools', 'Other'),
        },
        projects: (projects || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.user_edited_narrative || p.short_description || '',
            tags: parseTags(p.technologies),
            link: p.demo_url || '',
            repoUrl: p.repo_url || '',
            visible: p.is_visible !== false,
        })),
        experience: (experiences || []).map((e: any) => ({
            id: e.id,
            role: e.role,
            company: e.company,
            period: formatPeriod(e.start_date, e.end_date, e.is_current),
            description: e.user_edited_description || e.description || '',
            startDate: toMonth(e.start_date),
            endDate: toMonth(e.end_date),
            isCurrent: !!e.is_current,
            location: e.location || '',
            visible: e.is_visible !== false,
        })),
        education: (education || []).filter((e: any) => e.is_visible !== false).map((e: any) => ({
            id: e.id,
            institution: e.institution,
            degree: e.degree,
            field: e.field_of_study || '',
            period: formatPeriod(e.start_date, e.end_date, e.is_current),
            startDate: toMonth(e.start_date),
            endDate: toMonth(e.end_date),
            grade: e.grade || '',
        })),
    };

    const scheme = (portfolio.color_scheme || {}) as Record<string, any>;
    // Older saves stored a hex colour here; templates expect a theme name
    const theme = typeof scheme.primary === 'string' && !scheme.primary.startsWith('#') ? scheme.primary : 'indigo';

    return {
        id,
        subdomain: portfolio.subdomain,
        isPublic: portfolio.is_public !== false,
        seoTitle: portfolio.seo_title,
        seoDescription: portfolio.seo_description,
        template: portfolio.template_id || 'modern',
        theme,
        font: scheme.font || 'inter',
        data,
    };
}

export { onlyVisibleClient as onlyVisible } from './visible';
