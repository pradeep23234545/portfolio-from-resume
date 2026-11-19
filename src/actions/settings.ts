'use server';

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyJWT, comparePassword, hashPassword } from '@/lib/auth';
import { notify } from '@/lib/notifications';

async function getUserId() {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    return (payload?.sub as string | undefined) || null;
}

/** Personal details of the signed-in user (not the portfolio's content) */
export interface ProfileDetails {
    fullName: string;
    avatarUrl: string;
    headline: string;
    bio: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
}

export interface AccountInfo {
    id: string;
    email: string;
    createdAt: string | null;
    githubUsername: string | null;
    lastSignIn: { at: string; device: string } | null;
    previousSignIn: { at: string; device: string } | null;
}

const clean = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function readPrefs(supabase: any, userId: string): Promise<Record<string, any>> {
    const { data } = await supabase.from('user_preferences').select('preferences').eq('user_id', userId).maybeSingle();
    return (data?.preferences as Record<string, any>) || {};
}

export async function getProfile(): Promise<{ profile: ProfileDetails; account: AccountInfo } | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const supabase = createServiceClient() as any;

    const [{ data: user }, prefs] = await Promise.all([
        supabase.from('users').select('id, email, full_name, avatar_url, github_username, created_at').eq('id', userId).maybeSingle(),
        readPrefs(supabase, userId),
    ]);
    if (!user) return null;
    const p = (prefs.profile || {}) as Record<string, string>;

    return {
        profile: {
            fullName: user.full_name || '',
            avatarUrl: user.avatar_url || '',
            headline: p.headline || '',
            bio: p.bio || '',
            phone: p.phone || '',
            location: p.location || '',
            website: p.website || '',
            linkedin: p.linkedin || '',
        },
        account: {
            id: user.id,
            email: user.email,
            createdAt: user.created_at || null,
            githubUsername: user.github_username || null,
            lastSignIn: prefs.lastSignIn || null,
            previousSignIn: prefs.previousSignIn || null,
        },
    };
}

export async function updateProfile(input: ProfileDetails): Promise<{ success: true } | { error: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'Please sign in again.' };
    const supabase = createServiceClient() as any;

    const fullName = clean(input.fullName, 120);
    if (!fullName) return { error: 'Please enter your name.' };
    const website = clean(input.website, 300);
    const linkedin = clean(input.linkedin, 300);
    if (website && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(website)) return { error: 'That website address does not look right.' };
    if (linkedin && !/linkedin\.com\//i.test(linkedin)) return { error: 'Enter a LinkedIn profile URL (linkedin.com/in/…).' };

    const { error } = await supabase.from('users').update({
        full_name: fullName,
        avatar_url: clean(input.avatarUrl, 1000) || null,
        updated_at: new Date().toISOString(),
    }).eq('id', userId);
    if (error) return { error: error.message };

    const prefs = await readPrefs(supabase, userId);
    const { error: prefError } = await supabase.from('user_preferences').upsert({
        user_id: userId,
        preferences: {
            ...prefs,
            profile: {
                headline: clean(input.headline, 120),
                bio: clean(input.bio, 1000),
                phone: clean(input.phone, 40),
                location: clean(input.location, 120),
                website,
                linkedin,
            },
        },
        updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (prefError) return { error: prefError.message };

    await notify(supabase, userId, { kind: 'profile', title: 'Profile updated', body: 'Your personal details were saved.', href: '/settings' });
    return { success: true };
}

export async function changePassword(current: string, next: string): Promise<{ success: true } | { error: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'Please sign in again.' };
    if (typeof next !== 'string' || next.length < 8) return { error: 'The new password must be at least 8 characters.' };
    if (next === current) return { error: 'The new password must be different from the current one.' };

    const supabase = createServiceClient() as any;
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', userId).maybeSingle();
    if (!user?.password_hash || !(await comparePassword(String(current || ''), user.password_hash))) {
        return { error: 'Your current password is not correct.' };
    }
    const { error } = await supabase.from('users').update({ password_hash: await hashPassword(next), updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) return { error: error.message };

    await notify(supabase, userId, { kind: 'security', title: 'Password changed', body: 'Your account password was changed. If this was not you, contact support.', href: '/settings#account' });
    return { success: true };
}

/** Deletes the account and everything in it; the user must type their email to confirm. */
export async function deleteAccount(confirmEmail: string): Promise<{ success: true } | { error: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'Please sign in again.' };
    const supabase = createServiceClient() as any;

    const { data: user } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
    if (!user || String(confirmEmail || '').trim().toLowerCase() !== String(user.email).toLowerCase()) {
        return { error: 'Type your account email exactly to confirm.' };
    }

    // Child rows first, in case a foreign key was created without ON DELETE CASCADE
    const { data: portfolio } = await supabase.from('portfolios').select('id').eq('user_id', userId).maybeSingle();
    if (portfolio) {
        for (const table of ['projects', 'experiences', 'education', 'skills', 'certifications', 'portfolio_content', 'portfolio_analytics']) {
            await supabase.from(table).delete().eq('portfolio_id', portfolio.id);
        }
        await supabase.from('portfolios').delete().eq('id', portfolio.id);
    }
    for (const table of ['data_sources', 'user_preferences']) {
        await supabase.from(table).delete().eq('user_id', userId);
    }
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) return { error: `Could not delete the account: ${error.message}` };

    (await cookies()).delete('auth-token');
    return { success: true };
}
