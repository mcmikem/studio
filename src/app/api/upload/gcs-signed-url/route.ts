import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';
import { verifyApiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const isAuthorized = await verifyApiAuth(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, fileType, folder } = await request.json();

    if (!fileName || !fileType || !folder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { storage } = getFirebaseAdmin();
    
    if (!storage) {
      return NextResponse.json(
        { error: 'Storage service not available.' },
        { status: 500 }
      );
    }
    
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${timestamp}-${sanitizedName}`;
    
    const [signedUrl] = await storage.bucket().file(filePath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 5 * 60 * 1000,
      contentType: fileType,
    });

    const [readUrl] = await storage.bucket().file(filePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({
      uploadUrl: signedUrl,
      downloadUrl: readUrl,
      filePath,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
