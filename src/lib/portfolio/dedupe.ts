/**
 * The same project often arrives twice: from the resume/LinkedIn PDF
 * ("Restaurant E-commerce Platform") and from GitHub ("restaurant-ecommerce-platform").
 * Titles are compared ignoring case, spaces and punctuation.
 */
export const projectKey = (title: string) => (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** "AI_Based_GMAIL_Classifier" or "tern-search" look like repo names rather than titles. */
const looksLikeRepoName = (title: string) => !/\s/.test(title.trim()) && /[-_]/.test(title);

function unionTags(...lists: unknown[]): string[] {
    const seen = new Map<string, string>();
    for (const list of lists) {
        const items = Array.isArray(list) ? list : typeof list === 'string' ? safeParse(list) : [];
        for (const raw of items) {
            const tag = String(raw).trim();
            if (tag && !seen.has(tag.toLowerCase())) seen.set(tag.toLowerCase(), tag);
        }
    }
    return [...seen.values()];
}

function safeParse(value: string): unknown[] {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Merges projects with the same title into a single card. The GitHub row is kept
 * (so future syncs stay attached to it) and receives the best title, the longest
 * description, all tags and every link; the other copies are deleted.
 * Returns how many duplicate rows were removed.
 */
export async function mergeDuplicateProjects(supabase: any, portfolioId: string): Promise<number> {
    const { data: projects } = await supabase
        .from('projects')
        .select('id, title, short_description, technologies, repo_url, demo_url, source, source_id, is_visible, display_order')
        .eq('portfolio_id', portfolioId);

    const groups = new Map<string, any[]>();
    for (const p of projects || []) {
        const key = projectKey(p.title);
        if (!key) continue;
        groups.set(key, [...(groups.get(key) || []), p]);
    }

    let removed = 0;
    for (const group of groups.values()) {
        if (group.length < 2) continue;

        const keep = group.find(p => p.source_id) || group.find(p => p.repo_url) || group[0];
        const others = group.filter(p => p.id !== keep.id);

        // Prefer a human-written title over a repo name
        const title = group.map(p => p.title).find(t => !looksLikeRepoName(t)) || keep.title;
        const description = group
            .map(p => (p.short_description || '').trim())
            .sort((a, b) => b.length - a.length)[0] || null;

        const { error } = await supabase.from('projects').update({
            title,
            short_description: description,
            technologies: unionTags(...group.map(p => p.technologies)),
            repo_url: keep.repo_url || group.find(p => p.repo_url)?.repo_url || null,
            demo_url: keep.demo_url || group.find(p => p.demo_url)?.demo_url || null,
            is_visible: group.some(p => p.is_visible !== false),
            display_order: Math.min(...group.map(p => p.display_order ?? 0)),
            updated_at: new Date().toISOString(),
        }).eq('id', keep.id);
        if (error) continue;

        await supabase.from('projects').delete().in('id', others.map(p => p.id));
        removed += others.length;
    }
    return removed;
}
