'use server';

import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { generatePortfolioForUser, type GenerateResult } from '@/lib/generators/generate-for-user';

export async function generateMyPortfolio(): Promise<GenerateResult> {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    if (!payload?.sub) return { success: false, error: 'Please sign in again.' };
    return generatePortfolioForUser(payload.sub as string);
}
