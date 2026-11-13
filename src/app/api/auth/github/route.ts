import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://resume-to-portfolio-7zdz.onrender.com';
    const REDIRECT_URI = `${origin}/api/auth/github/callback`;

    if (!GITHUB_CLIENT_ID || /your-|your_/i.test(GITHUB_CLIENT_ID)) {
        // OAuth isn't set up: send the user back to enter their username instead
        return NextResponse.redirect(new URL('/connect?github=not-configured', req.url));
    }

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'read:user user:email',
        allow_signup: 'true',
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return NextResponse.redirect(url);
}
