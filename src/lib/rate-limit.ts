import { getFirebaseAdmin } from '@/firebase/server-only';
import { FieldValue } from 'firebase-admin/firestore';

interface FirestoreRateLimitEntry {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_COLLECTION = 'rateLimits';
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10;

export async function checkRateLimit(
  identifier: string,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const { firestore } = getFirebaseAdmin();
    const now = Date.now();
    const rateLimitDocRef = firestore.collection(RATE_LIMIT_COLLECTION).doc(identifier);

    const rateLimitSnap = await rateLimitDocRef.get();
    let entry: FirestoreRateLimitEntry | null = null;

    if (rateLimitSnap.exists) {
      entry = rateLimitSnap.data() as FirestoreRateLimitEntry;
    }

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      await rateLimitDocRef.set(entry);
    }

    entry.count++;
    const remaining = Math.max(0, maxRequests - entry.count);
    const allowed = entry.count <= maxRequests;

    await rateLimitDocRef.update({
      count: entry.count,
      resetTime: entry.resetTime,
    });

    return { allowed, remaining, resetTime: entry.resetTime };
  } catch (error) {
    return { allowed: false, remaining: 0, resetTime: Date.now() + windowMs };
  }
}

export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const { firestore } = getFirebaseAdmin();
    await firestore.collection(RATE_LIMIT_COLLECTION).doc(identifier).delete();
  } catch (error) {
    // Silently fail
  }
}

export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = args[0]?.userId || args[0]?.email || args[0]?.identifier || 'anonymous';
    const result = await checkRateLimit(identifier, windowMs, maxRequests);
    if (!result.allowed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    return handler(...args);
  }) as T;
}

export function createRateLimitMiddleware(
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
) {
  return async (identifier: string) => checkRateLimit(identifier, windowMs, maxRequests);
}

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

export const defaultConfig: Required<RateLimitConfig> = {
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: DEFAULT_MAX_REQUESTS,
  message: 'Too many requests. Please try again later.',
};
