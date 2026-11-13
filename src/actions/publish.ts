'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyJWT } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';

export interface PublishStatus {
    subdomain: string;
    isPublished: boolean;
    publishedAt: string | null;
}

async function getUserId() {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    return (payload?.sub as string | undefined) || null;
}

/** The signed-in user's portfolio address and whether it is public. */
export async function getPublishStatus(): Promise<PublishStatus | null> {
    const userId = await getUserId();
    if (!userId) return null;
    const supabase = createServiceClient() as any;
    const { data } = await supabase
        .from('portfolios')
        .select('subdomain, is_published, published_at')
        .eq('user_id', userId)
        .maybeSingle();
    if (!data) return null;
    return { subdomain: data.subdomain, isPublished: !!data.is_published, publishedAt: data.published_at };
}

/** Makes the portfolio public (or hides it again). */
export async function setPublished(publish: boolean): Promise<PublishStatus | { error: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'Please sign in again.' };
    const supabase = createServiceClient() as any;

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('portfolios')
        .update({
            is_published: publish,
            is_public: true,
            ...(publish ? { published_at: now } : {}),
            updated_at: now,
        })
        .eq('user_id', userId)
        .select('subdomain, is_published, published_at')
        .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: 'No portfolio yet. Generate it first.' };

    revalidatePath(`/portfolio/${data.subdomain}`);
    return { subdomain: data.subdomain, isPublished: !!data.is_published, publishedAt: data.published_at };
}
