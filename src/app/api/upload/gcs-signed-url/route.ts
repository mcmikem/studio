import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, folder, userId } = await request.json();

    if (!fileName || !fileType || !folder || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { storage } = getFirebaseAdmin();
    
    if (!storage) {
      return NextResponse.json(
        { error: 'Storage service not available. Please configure service account.' },
        { status: 500 }
      );
    }
    
    // Generate a unique file path
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${userId}/${timestamp}-${sanitizedName}`;
    
    // Get a signed URL for upload (valid for 5 minutes)
    const [signedUrl] = await storage.bucket().file(filePath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      contentType: fileType,
    });

    // Also get a signed URL for reading (valid for 1 year)
    const [readUrl] = await storage.bucket().file(filePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    return NextResponse.json({
      uploadUrl: signedUrl,
      downloadUrl: readUrl,
      filePath,
    });
  } catch (error: any) {
    console.error('GCS signed URL error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
