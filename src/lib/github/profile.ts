/** Public GitHub profile fields we use for the portfolio. */
export interface GithubProfile {
    login: string;
    name: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    blog: string | null;
    company: string | null;
    twitter_username: string | null;
    email: string | null;
    public_repos?: number;
    followers?: number;
}

/**
 * Stores the GitHub profile as a data source (used by the AI generator) and fills
 * the user's name and photo when they don't have one yet. Never overwrites
 * values the user already set.
 */
export async function saveGithubProfile(supabase: any, userId: string, profile: GithubProfile) {
    const { data: user } = await supabase.from('users').select('full_name, avatar_url').eq('id', userId).maybeSingle();

    const patch: Record<string, unknown> = { github_username: profile.login, updated_at: new Date().toISOString() };
    if (!user?.full_name && profile.name) patch.full_name = profile.name;
    if (!user?.avatar_url && profile.avatar_url) patch.avatar_url = profile.avatar_url;
    const { error } = await supabase.from('users').update(patch).eq('id', userId);
    if (error) return { error };

    const sourceData = {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        blog: profile.blog,
        company: profile.company,
        twitter_username: profile.twitter_username,
        email: profile.email,
        public_repos: profile.public_repos,
        followers: profile.followers,
    };
    await supabase.from('data_sources').upsert(
        {
            user_id: userId,
            source_type: 'github',
            source_identifier: profile.login,
            source_data: sourceData,
            last_synced_at: new Date().toISOString(),
            sync_status: 'completed',
        },
        { onConflict: 'user_id,source_type' }
    );
    return { error: null };
}

/** Fetches a public GitHub profile by username. */
export async function fetchGithubProfile(username: string): Promise<{ profile: GithubProfile } | { error: string }> {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_ACCESS_TOKEN) headers.Authorization = `token ${process.env.GITHUB_ACCESS_TOKEN}`;

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, cache: 'no-store' });
    if (res.status === 404) return { error: `GitHub user "${username}" was not found.` };
    if (!res.ok) return { error: `GitHub API error: ${res.status} ${res.statusText}` };
    return { profile: (await res.json()) as GithubProfile };
}
