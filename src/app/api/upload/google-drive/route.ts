import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';

async function verifyAuthToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  const internalKey = process.env.INTERNAL_API_KEY;
  
  if (internalKey && authHeader === `Bearer ${internalKey}`) {
    return true;
  }
  
  const apiKey = request.headers.get('X-API-Key');
  if (internalKey && apiKey === internalKey) {
    return true;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAuthToken(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
