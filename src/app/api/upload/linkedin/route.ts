import { NextRequest } from 'next/server';
import { handleProfilePdfUpload } from '@/lib/uploads/profile-pdf';

export async function POST(request: NextRequest) {
    return handleProfilePdfUpload(request, 'linkedin');
}
