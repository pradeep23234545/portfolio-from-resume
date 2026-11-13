'use server';

import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';

/** Returns the signed-in user's portfolio subdomain, or null if no portfolio exists yet. */
export async function getUserSubdomain(): Promise<string | null> {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    if (!payload?.sub) return null;

    const supabase = createServiceClient() as any;
    const { data } = await supabase
        .from('portfolios')
        .select('subdomain')
        .eq('user_id', payload.sub)
        .maybeSingle();

    return (data?.subdomain as string | undefined) || null;
}
