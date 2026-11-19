'use server';

import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { getNotificationsFor, updateNotifications, type AppNotification } from '@/lib/notifications';

async function getUserId() {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    return (payload?.sub as string | undefined) || null;
}

export async function listNotifications(): Promise<AppNotification[]> {
    const userId = await getUserId();
    if (!userId) return [];
    return getNotificationsFor(createServiceClient(), userId);
}

export async function markNotificationRead(id: string) {
    const userId = await getUserId();
    if (!userId) return [];
    return updateNotifications(createServiceClient(), userId, list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
}

export async function markAllNotificationsRead() {
    const userId = await getUserId();
    if (!userId) return [];
    return updateNotifications(createServiceClient(), userId, list => list.map(n => ({ ...n, read: true })));
}

export async function removeNotification(id: string) {
    const userId = await getUserId();
    if (!userId) return [];
    return updateNotifications(createServiceClient(), userId, list => list.filter(n => n.id !== id));
}

export async function clearNotifications() {
    const userId = await getUserId();
    if (!userId) return [];
    return updateNotifications(createServiceClient(), userId, () => []);
}
