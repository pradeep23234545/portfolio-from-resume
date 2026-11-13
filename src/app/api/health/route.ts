import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Health check. Vercel calls this once a day (see vercel.json) so the free
 * Supabase project sees activity and is not paused for inactivity.
 */
export async function GET() {
    try {
        const supabase = createServiceClient() as any;
        const { error } = await supabase.from('templates').select('id', { head: true, count: 'exact' });
        if (error) throw error;
        return NextResponse.json({ ok: true, database: 'up', time: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json(
            { ok: false, database: 'down', error: error instanceof Error ? error.message : 'unknown' },
            { status: 503 }
        );
    }
}
