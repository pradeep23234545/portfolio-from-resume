import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { generatePortfolioForUser } from '@/lib/generators/generate-for-user';

/** POST /api/generate/portfolio — builds and publishes the signed-in user's portfolio. */
export async function POST(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    if (!payload?.sub) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await generatePortfolioForUser(payload.sub as string);
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
}
