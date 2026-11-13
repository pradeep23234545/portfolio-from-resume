import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const YEAR = 60 * 60 * 24 * 365;
const SESSION = 60 * 30; // a visit ends after 30 minutes without activity

function deviceType(ua: string) {
    if (/ipad|tablet/i.test(ua)) return 'Tablet';
    if (/mobi|android|iphone/i.test(ua)) return 'Mobile';
    return 'Desktop';
}

function browserName(ua: string) {
    if (/edg\//i.test(ua)) return 'Edge';
    if (/opr\/|opera/i.test(ua)) return 'Opera';
    if (/chrome\//i.test(ua)) return 'Chrome';
    if (/firefox\//i.test(ua)) return 'Firefox';
    if (/safari\//i.test(ua)) return 'Safari';
    return 'Other';
}

/**
 * Records a portfolio page view for the owner's Analytics page.
 * Privacy: no IP address is stored; visitors are counted with a random cookie id.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const portfolioId = typeof body.portfolioId === 'string' ? body.portfolioId : '';
        if (!UUID.test(portfolioId)) return new NextResponse(null, { status: 204 });

        const ua = req.headers.get('user-agent') || '';
        if (/bot|crawl|spider|preview|headless/i.test(ua)) return new NextResponse(null, { status: 204 });

        const visitorId = req.cookies.get('pv_vid')?.value || crypto.randomUUID();
        const sessionId = req.cookies.get('pv_sid')?.value || crypto.randomUUID();

        const supabase = createServiceClient() as any;
        // Only count views of published portfolios
        const { data: portfolio } = await supabase.from('portfolios').select('id').eq('id', portfolioId).eq('is_published', true).maybeSingle();
        if (portfolio) {
            const referrer = typeof body.referrer === 'string' && /^https?:\/\//.test(body.referrer) ? body.referrer.slice(0, 500) : null;
            await supabase.from('portfolio_analytics').insert({
                portfolio_id: portfolioId,
                event_type: 'view',
                visitor_id: visitorId,
                session_id: sessionId,
                page_path: typeof body.path === 'string' ? body.path.slice(0, 200) : null,
                referrer,
                device_type: deviceType(ua),
                browser: browserName(ua),
                // Set by Vercel's edge network; absent when running locally
                country: req.headers.get('x-vercel-ip-country') || null,
            });
        }

        const res = new NextResponse(null, { status: 204 });
        const secure = process.env.NODE_ENV === 'production';
        res.cookies.set('pv_vid', visitorId, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: YEAR });
        res.cookies.set('pv_sid', sessionId, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: SESSION });
        return res;
    } catch (error) {
        console.error('track error:', error);
        return new NextResponse(null, { status: 204 });
    }
}
