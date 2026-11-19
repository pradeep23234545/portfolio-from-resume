export const ALL_SOURCES = ['github', 'resume', 'linkedin'] as const;
export type DataSource = (typeof ALL_SOURCES)[number];

export const SOURCE_LABELS: Record<DataSource, string> = {
    github: 'GitHub',
    resume: 'Resume / CV',
    linkedin: 'LinkedIn',
};

export function isDataSource(value: unknown): value is DataSource {
    return typeof value === 'string' && (ALL_SOURCES as readonly string[]).includes(value);
}

/** Profile photos that came from a GitHub account rather than an upload */
const isGithubAvatar = (url: unknown) =>
    typeof url === 'string' && /avatars\.githubusercontent\.com|github\.com\/[^/]+\.png/i.test(url);

/**
 * Clears everything a previous generation put in the portfolio — projects,
 * experience, education, skills, the About section, the LinkedIn link and a
 * GitHub profile photo — so the next build contains only what the selected
 * sources provide. Raw imports stay in `data_sources` and are re-applied afterwards.
 */
export async function resetPortfolioContent(supabase: any, userId: string, portfolioId: string) {
    for (const table of ['projects', 'experiences', 'education', 'skills', 'certifications']) {
        const { error } = await supabase.from(table).delete().eq('portfolio_id', portfolioId);
        if (error) throw new Error(`Could not clear ${table}: ${error.message}`);
    }
    await supabase.from('portfolio_content').delete().eq('portfolio_id', portfolioId).eq('section_type', 'about');

    const { data: user } = await supabase.from('users').select('avatar_url').eq('id', userId).maybeSingle();
    const patch: Record<string, unknown> = { linkedin_url: null, updated_at: new Date().toISOString() };
    // An uploaded photo stays; a GitHub one is refilled by the GitHub sync only if GitHub is selected
    if (isGithubAvatar(user?.avatar_url)) patch.avatar_url = null;
    await supabase.from('users').update(patch).eq('id', userId);
}
