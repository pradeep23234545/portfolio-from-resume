import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { loadPortfolio, onlyVisible } from '@/lib/portfolio/load';
import { exportPortfolioHtml } from '@/lib/portfolio/export-html';
import { createServiceClient } from '@/lib/supabase/service';
import { notify } from '@/lib/notifications';

export const runtime = 'nodejs';

/** GET /api/export → downloads the signed-in user's portfolio as a standalone index.html */
export async function GET(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    if (!payload?.sub) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    const userId = payload.sub as string;

    const portfolio = await loadPortfolio({ userId });
    if (!portfolio) return NextResponse.json({ error: 'Generate your portfolio first.' }, { status: 404 });

    try {
        const html = await exportPortfolioHtml(portfolio, onlyVisible(portfolio.data));
        await notify(createServiceClient(), userId, {
            kind: 'publish',
            title: 'Website exported',
            body: 'Downloaded your portfolio as index.html. Upload it to Netlify, GitHub Pages or Vercel to put it online.',
            href: '/preview',
        });
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': 'attachment; filename="index.html"',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json({
            error: 'Could not build the website file. Please try again.',
            ...(process.env.NODE_ENV !== 'production' ? { detail: String(error instanceof Error ? error.stack : error).slice(0, 1500) } : {}),
        }, { status: 500 });
    }
}
