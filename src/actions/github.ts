'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { fetchGithubProfile, saveGithubProfile } from '@/lib/github/profile';
import { mergeDuplicateProjects, projectKey } from '@/lib/portfolio/dedupe';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { notify } from '@/lib/notifications';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    return payload?.sub as string | undefined;
}

export async function syncGithubRepositories(options?: { notify?: boolean }) {
    const userId = await getUserId();
    if (!userId) return { error: 'Not authenticated' };

    const supabase = createServiceClient();

    // 1. Get User Info (GitHub Username)
    const { data: rawUser } = await supabase.from('users').select('github_username').eq('id', userId).maybeSingle();
    const user = rawUser as any;

    if (!user || !user.github_username) {
        return { error: 'No GitHub username linked' };
    }

    // Refresh the GitHub profile (name, photo, bio, location, website…) used by the generator
    const profileResult = await fetchGithubProfile(user.github_username);
    if ('profile' in profileResult) await saveGithubProfile(supabase, userId, profileResult.profile);

    // 2. Get Portfolio ID
    const { data: rawPortfolio } = await supabase.from('portfolios').select('id').eq('user_id', userId).maybeSingle();
    let portfolio = rawPortfolio as any;

    if (!portfolio) {
        // Create default portfolio if missing
        // Verify we have a valid subdomain source
        let subdomain = user.github_username;
        if (!subdomain) {
            // Fallback to part of email or random string
            const { data: rawUserEmail } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
            const userEmail = rawUserEmail as any;

            if (userEmail && userEmail.email) {
                subdomain = userEmail.email.split('@')[0];
            } else {
                subdomain = `user-${userId.slice(0, 8)}`;
            }
        }

        // Sanitize subdomain
        subdomain = subdomain.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();

        const { data: newPortfolio, error: createError } = await supabase.from('portfolios').insert({
            user_id: userId,
            subdomain: subdomain,
            template_id: 'modern',
            updated_at: new Date().toISOString()
        } as any).select().maybeSingle();

        if (createError) {
            console.error('Failed to create portfolio during sync:', createError);
            // Check if it's a unique constraint error on subdomain
            if (createError.code === '23505') { // Unique violation
                // Try one more time with random suffix
                const retrySubdomain = `${subdomain}-${Math.floor(Math.random() * 1000)}`;
                const { data: retryPortfolio, error: retryError } = await supabase.from('portfolios').insert({
                    user_id: userId,
                    subdomain: retrySubdomain,
                    template_id: 'modern',
                    updated_at: new Date().toISOString()
                } as any).select().maybeSingle();

                if (retryError) {
                    return { error: `Failed to create portfolio context: ${retryError.message}` };
                }
                portfolio = retryPortfolio;
            } else {
                return { error: `Failed to create portfolio context: ${createError.message} (Code: ${createError.code})` };
            }
        } else {
            portfolio = newPortfolio;
        }
    }

    try {
        // 3. Fetch Repos from GitHub
        // Use a personal access token if available in env for higher rate limits, otherwise public
        // Ideally we should use the user's access token if we stored it, but we didn't store it in callbacks.
        // For public repos, unauthenticated is fine but rate limited.
        // Since we are running on server, we can use our GITHUB_CLIENT_ID/SECRET for higher limits if we implement app auth, 
        // but for now let's try simple fetch.

        const token = process.env.GITHUB_ACCESS_TOKEN;
        const headers: any = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        const res = await fetch(`https://api.github.com/users/${user.github_username}/repos?sort=updated&per_page=10&type=owner`, {
            headers
        });
        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.statusText}`);
        }

        const repos = await res.json();
        const db = supabase as any;

        // Existing projects, to update in place or attach repos to resume projects of the same name
        const { data: existingRows } = await db
            .from('projects')
            .select('id, title, short_description, technologies, demo_url, source_id, display_order')
            .eq('portfolio_id', portfolio.id);
        const existing: any[] = existingRows || [];
        let nextOrder = Math.max(-1, ...existing.map(p => p.display_order ?? 0)) + 1;

        // 4. Upsert Projects
        let count = 0;
        for (const repo of repos) {
            // The "username/username" repo is the GitHub profile README, not a project
            if (String(repo.name).toLowerCase() === String(user.github_username).toLowerCase()) continue;

            const match =
                existing.find(p => p.source_id === String(repo.id)) ||
                existing.find(p => !p.source_id && projectKey(p.title) === projectKey(repo.name));

            if (match) {
                // Only fill in GitHub facts; never overwrite the title, description,
                // visibility or order the user (or the resume import) already set
                const tags = Array.isArray(match.technologies) ? match.technologies : [];
                const hasLanguage = !repo.language || tags.some((t: string) => String(t).toLowerCase() === String(repo.language).toLowerCase());
                await db.from('projects').update({
                    source_id: String(repo.id),
                    repo_url: repo.html_url,
                    demo_url: match.demo_url || repo.homepage || null,
                    short_description: match.short_description || repo.description || null,
                    technologies: hasLanguage ? tags : [...tags, repo.language],
                    updated_at: new Date().toISOString(),
                }).eq('id', match.id);
            } else {
                await db.from('projects').insert({
                    portfolio_id: portfolio.id,
                    title: repo.name,
                    slug: String(repo.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${repo.id}`,
                    short_description: repo.description,
                    repo_url: repo.html_url,
                    demo_url: repo.homepage || null,
                    technologies: [repo.language].filter(Boolean),
                    source: 'github',
                    source_id: String(repo.id),
                    is_visible: true,
                    display_order: nextOrder++,
                    updated_at: new Date().toISOString(),
                });
            }
            count++;
        }

        // Combine any remaining copies of the same project into one card
        await mergeDuplicateProjects(db, portfolio.id);

        if (options?.notify) {
            await notify(supabase, userId, {
                kind: 'source', title: 'GitHub synced',
                body: `Fetched ${count} repositories from @${user.github_username}.`, href: '/connect',
            });
        }
        return { success: true, count };

    } catch (error: any) {
        console.error('Sync GitHub Error:', error);
        return { error: error.message };
    }
}

/**
 * Links a GitHub account by username (no OAuth needed — only public repos are read).
 * Verifies the user exists on GitHub, saves it, then syncs repositories.
 */
export async function linkGithubUsername(input: string) {
    const userId = await getUserId();
    if (!userId) return { error: 'Not authenticated' };

    // Accept "name", "@name" or a full profile URL
    const username = input.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//i, '').split(/[/?#]/)[0];
    if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(username)) {
        return { error: 'That does not look like a GitHub username.' };
    }

    const result = await fetchGithubProfile(username);
    if ('error' in result) return { error: result.error };
    const profile = result.profile;

    const supabase = createServiceClient() as any;
    const { data: current } = await supabase.from('users').select('github_username').eq('id', userId).maybeSingle();
    const previous: string | null = current?.github_username || null;

    // Saves username + profile (name, photo, bio, location, website…) without overwriting user edits
    const { error } = await saveGithubProfile(supabase, userId, profile);
    if (error) {
        if (error.code === '23505') return { error: 'This GitHub account is already linked to another user.' };
        return { error: error.message };
    }

    // Switching accounts: drop the previous account's repos (resume/LinkedIn projects
    // they were attached to stay, just without the old repo link)
    if (previous && previous.toLowerCase() !== String(profile.login).toLowerCase()) {
        const { data: portfolio } = await supabase.from('portfolios').select('id').eq('user_id', userId).maybeSingle();
        if (portfolio) {
            await supabase.from('projects').delete().eq('portfolio_id', portfolio.id).eq('source', 'github');
            await supabase.from('projects').update({ source_id: null, repo_url: null })
                .eq('portfolio_id', portfolio.id).not('source_id', 'is', null);
        }
    }

    const sync = await syncGithubRepositories();
    const switched = previous && previous.toLowerCase() !== String(profile.login).toLowerCase();
    await notify(supabase, userId, {
        kind: 'source',
        title: switched ? 'GitHub account switched' : 'GitHub connected',
        body: switched ? `Now using @${profile.login} instead of @${previous}.` : `Linked @${profile.login} and fetched ${sync.count ?? 0} repositories.`,
        href: '/connect',
    });
    return { success: true, username: profile.login as string, count: sync.count ?? 0, syncError: sync.error };
}
