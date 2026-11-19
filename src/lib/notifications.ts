/**
 * Per-user notification log, kept in user_preferences.preferences.notifications
 * (newest first, capped), so no extra table is needed.
 */

export type NotificationKind =
    | 'login' | 'account' | 'profile' | 'security'
    | 'source' | 'generate' | 'publish' | 'content';

export interface AppNotification {
    id: string;
    kind: NotificationKind;
    title: string;
    body: string;
    /** In-app page the notification is about */
    href?: string;
    createdAt: string;
    read: boolean;
}

const MAX_NOTIFICATIONS = 50;

async function readPreferences(supabase: any, userId: string): Promise<Record<string, any>> {
    const { data } = await supabase.from('user_preferences').select('preferences').eq('user_id', userId).maybeSingle();
    return (data?.preferences as Record<string, any>) || {};
}

async function writePreferences(supabase: any, userId: string, preferences: Record<string, any>) {
    const { error } = await supabase.from('user_preferences').upsert(
        { user_id: userId, preferences, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
    );
    if (error) console.error('Saving notifications failed:', error.message);
}

export async function getNotificationsFor(supabase: any, userId: string): Promise<AppNotification[]> {
    const prefs = await readPreferences(supabase, userId);
    return Array.isArray(prefs.notifications) ? prefs.notifications : [];
}

/** Applies a change to the user's list and saves it */
export async function updateNotifications(
    supabase: any,
    userId: string,
    change: (list: AppNotification[]) => AppNotification[],
) {
    const prefs = await readPreferences(supabase, userId);
    const list = Array.isArray(prefs.notifications) ? prefs.notifications : [];
    const next = change(list).slice(0, MAX_NOTIFICATIONS);
    await writePreferences(supabase, userId, { ...prefs, notifications: next });
    return next;
}

/** Records something that happened. Never throws: a failed notification must not break the action. */
export async function notify(
    supabase: any,
    userId: string,
    n: { kind: NotificationKind; title: string; body: string; href?: string },
) {
    try {
        const item: AppNotification = {
            id: crypto.randomUUID(),
            ...n,
            createdAt: new Date().toISOString(),
            read: false,
        };
        await updateNotifications(supabase, userId, list => [item, ...list]);
    } catch (error) {
        console.error('notify failed:', error);
    }
}

/** Saves the sign-in time (shown in Account) and adds a "New sign-in" notification */
export async function recordSignIn(supabase: any, userId: string, device: string) {
    try {
        const prefs = await readPreferences(supabase, userId);
        const now = new Date().toISOString();
        const item: AppNotification = {
            id: crypto.randomUUID(),
            kind: 'login',
            title: 'New sign-in to your account',
            body: `Signed in from ${device}. If this wasn't you, change your password in Profile.`,
            href: '/settings',
            createdAt: now,
            read: false,
        };
        const list = Array.isArray(prefs.notifications) ? prefs.notifications : [];
        await writePreferences(supabase, userId, {
            ...prefs,
            previousSignIn: prefs.lastSignIn || null,
            lastSignIn: { at: now, device },
            notifications: [item, ...list].slice(0, MAX_NOTIFICATIONS),
        });
    } catch (error) {
        console.error('recordSignIn failed:', error);
    }
}

/** "Chrome on Windows" from a User-Agent header, for sign-in notifications */
export function describeDevice(userAgent: string | null) {
    const ua = userAgent || '';
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
        : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'a browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
        : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'an unknown device';
    return `${browser} on ${os}`;
}
