import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const isAuthorized = await verifyApiAuth(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileName, content, folder } = body;

    if (!fileName || !content) {
      return NextResponse.json({ error: 'Missing fileName or content' }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'omuto-studio-uploads';
    const githubBranch = process.env.GITHUB_BRANCH || 'main';

    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub not configured.' }, { status: 500 });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const path = `uploads/${folder || 'general'}/${timestamp}-${safeName}`;
    const encodedPath = encodeURIComponent(path);

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${encodedPath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: `Upload: ${fileName}`,
          content: content,
          branch: githubBranch,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'GitHub upload failed' }, { status: response.status });
    }

    const data = await response.json();
    const downloadUrl = data.content.download_url;

    return NextResponse.json({ 
      success: true, 
      url: downloadUrl, 
      path,
      provider: 'github'
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
