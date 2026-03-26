import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { storage } = getFirebaseAdmin();
    
    if (!storage) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${timestamp}-${safeName}`;
    
    const bucket = storage.bucket();
    const gcsFile = bucket.file(filePath);
    
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const [url] = await gcsFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({ 
      success: true, 
      url, 
      path: filePath,
      provider: 'google-cloud-storage'
    });
  } catch (error: any) {
    console.error('[GCS Upload API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}