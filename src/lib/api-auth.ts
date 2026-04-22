import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/firebase/server-only';

export async function verifyApiAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');
  const internalKey = process.env.INTERNAL_API_KEY;

  if (internalKey && (authHeader === `Bearer ${internalKey}` || apiKey === internalKey)) {
    return true;
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return false;

  try {
    const adminApp = getAdminApp();
    await getAuth(adminApp).verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
}
