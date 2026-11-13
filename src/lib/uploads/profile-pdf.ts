import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { parseResumePDF } from '@/lib/parsers/resume';
import { serverErrorMessage } from '@/lib/utils';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Shared handler for resume and LinkedIn PDF uploads: authenticates the user,
 * extracts structured data with Gemini and stores it in `data_sources`.
 */
export async function handleProfilePdfUpload(
    request: NextRequest,
    sourceType: 'resume' | 'linkedin'
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? await verifyJWT(token) : null;
        if (!payload?.sub) {
            return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
        }
        const userId = payload.sub as string;

        const formData = await request.formData();
        const file = formData.get('file');
        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'PDF must be smaller than 10 MB' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await parseResumePDF(buffer);

        const supabase = createServiceClient();
        const { error } = await (supabase.from('data_sources') as any).upsert(
            {
                user_id: userId,
                source_type: sourceType,
                source_identifier: file.name,
                source_data: parsed,
                raw_data: { filename: file.name, size: file.size },
                last_synced_at: new Date().toISOString(),
                sync_status: 'completed',
                sync_error: null,
            },
            { onConflict: 'user_id,source_type' }
        );

        if (error) {
            return NextResponse.json({ error: serverErrorMessage(error, 'Failed to save upload') }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: parsed });
    } catch (error) {
        console.error(`Error uploading ${sourceType}:`, error);
        return NextResponse.json(
            { error: serverErrorMessage(error, `Failed to process ${sourceType} PDF`) },
            { status: 500 }
        );
    }
}
