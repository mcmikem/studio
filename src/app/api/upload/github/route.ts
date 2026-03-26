import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'GitHub not configured. Set GITHUB_TOKEN in environment.' }, { status: 500 });
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
      const error = await response.json();
      console.error('[GitHub Upload] API error:', error);
      return NextResponse.json({ error: error.message || 'GitHub upload failed' }, { status: response.status });
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
    console.error('[GitHub Upload API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}