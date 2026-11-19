'use server';

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyJWT } from '@/lib/auth';
import { getNotificationsFor, type AppNotification } from '@/lib/notifications';
import { LAYOUTS } from '@/lib/portfolio/layouts';

async function getUserId() {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    return (payload?.sub as string | undefined) || null;
}

export interface SourceStatus {
    type: 'github' | 'resume' | 'linkedin';
    label: string;
    connected: boolean;
    identifier: string | null;
    lastSyncedAt: string | null;
    status: string | null;
}

export interface DashboardOverview {
    userName: string;
    portfolio: {
        exists: boolean;
        subdomain: string | null;
        layout: string;
        theme: string;
        isPublished: boolean;
        publishedAt: string | null;
        lastGeneratedAt: string | null;
        updatedAt: string | null;
        seoDescriptionLength: number;
    };
    counts: {
        projects: number; visibleProjects: number; withRepo: number;
        experiences: number; education: number; skills: number;
    };
    skillCategories: { label: string; count: number }[];
    topTech: { name: string; count: number }[];
    sources: SourceStatus[];
    health: { score: number; checks: { label: string; completed: boolean; hint: string; href: string }[] };
    activity: AppNotification[];
}

const tags = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(String) : []; } catch { return []; } }
    return [];
};

export async function getDashboardOverview(): Promise<DashboardOverview | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const supabase = createServiceClient() as any;

    const [{ data: user }, { data: portfolio }, { data: sourceRows }, activity] = await Promise.all([
        supabase.from('users').select('full_name, email, github_username').eq('id', userId).maybeSingle(),
        supabase.from('portfolios').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('data_sources').select('source_type, source_identifier, last_synced_at, sync_status').eq('user_id', userId),
        getNotificationsFor(supabase, userId),
    ]);

    const pid = portfolio?.id;
    const empty = { data: [] as any[] };
    const [{ data: projects }, { data: experiences }, { data: education }, { data: skills }, { data: about }] = pid
        ? await Promise.all([
            supabase.from('projects').select('technologies, is_visible, repo_url').eq('portfolio_id', pid),
            supabase.from('experiences').select('id').eq('portfolio_id', pid),
            supabase.from('education').select('id').eq('portfolio_id', pid),
            supabase.from('skills').select('category, is_visible').eq('portfolio_id', pid),
            supabase.from('portfolio_content').select('content').eq('portfolio_id', pid).eq('section_type', 'about').limit(1),
        ])
        : [empty, empty, empty, empty, empty];

    const p = projects || [], sk = (skills || []).filter((s: any) => s.is_visible !== false);
    const counts = {
        projects: p.length,
        visibleProjects: p.filter((x: any) => x.is_visible !== false).length,
        withRepo: p.filter((x: any) => x.repo_url).length,
        experiences: (experiences || []).length,
        education: (education || []).length,
        skills: sk.length,
    };

    // Technology frequency across projects
    const freq = new Map<string, { name: string; count: number }>();
    for (const project of p) {
        for (const t of tags(project.technologies)) {
            const key = t.trim().toLowerCase();
            if (!key) continue;
            const entry = freq.get(key) || { name: t.trim(), count: 0 };
            entry.count++;
            freq.set(key, entry);
        }
    }
    const topTech = [...freq.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 8);

    const skillCategories = ['Frontend', 'Backend', 'Tools'].map(label => ({
        label,
        count: sk.filter((s: any) => (label === 'Tools' ? !['Frontend', 'Backend'].includes(s.category) : s.category === label)).length,
    }));

    const rows: any[] = sourceRows || [];
    const source = (type: SourceStatus['type'], label: string): SourceStatus => {
        const r = rows.find(x => x.source_type === type);
        const connected = type === 'github' ? !!user?.github_username : !!r;
        return {
            type, label, connected,
            identifier: type === 'github' ? (user?.github_username ? `@${user.github_username}` : null) : r?.source_identifier || null,
            lastSyncedAt: r?.last_synced_at || null,
            status: connected ? r?.sync_status || 'completed' : null,
        };
    };
    const sources = [source('github', 'GitHub'), source('resume', 'Resume / CV'), source('linkedin', 'LinkedIn')];

    const bio: string = about?.[0]?.content || '';
    const seoLen = (portfolio?.seo_description || '').length;
    const checks = [
        { label: 'At least one data source', completed: sources.some(s => s.connected), hint: 'Connect GitHub or upload a resume', href: '/connect' },
        { label: 'Portfolio generated', completed: !!portfolio?.last_synced_at, hint: 'Run Generate once', href: '/generate' },
        { label: 'About section (60+ words)', completed: bio.split(/\s+/).filter(Boolean).length >= 60, hint: 'Write or regenerate your About text', href: '/customize' },
        { label: `${counts.visibleProjects} visible project${counts.visibleProjects === 1 ? '' : 's'} (3+)`, completed: counts.visibleProjects >= 3, hint: 'Add or show more projects', href: '/projects' },
        { label: 'Experience listed', completed: counts.experiences > 0, hint: 'Add a role or internship', href: '/experience' },
        { label: `${counts.skills} skills (5+)`, completed: counts.skills >= 5, hint: 'Add more skills', href: '/skills' },
        { label: 'SEO description 120–160 chars', completed: seoLen >= 120 && seoLen <= 170, hint: 'Regenerate to rewrite it', href: '/generate' },
        { label: 'Published', completed: !!portfolio?.is_published, hint: 'Publish it from Preview', href: '/preview' },
    ];
    const score = Math.round((checks.filter(c => c.completed).length / checks.length) * 100);

    const scheme = (portfolio?.color_scheme || {}) as Record<string, any>;
    return {
        userName: user?.full_name || user?.email || 'there',
        portfolio: {
            exists: !!portfolio,
            subdomain: portfolio?.subdomain || null,
            layout: LAYOUTS.find(l => l.id === portfolio?.template_id)?.name || 'Modern',
            theme: typeof scheme.primary === 'string' && !scheme.primary.startsWith('#') ? scheme.primary : 'indigo',
            isPublished: !!portfolio?.is_published,
            publishedAt: portfolio?.published_at || null,
            lastGeneratedAt: portfolio?.last_synced_at || null,
            updatedAt: portfolio?.updated_at || null,
            seoDescriptionLength: seoLen,
        },
        counts,
        skillCategories,
        topTech,
        sources,
        health: { score, checks },
        activity: activity.slice(0, 8),
    };
}
