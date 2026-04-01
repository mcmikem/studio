import { doc, getDoc, setDoc, updateDoc, deleteDoc, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/firebase/server-only';

interface FirestoreRateLimitEntry {
  count: number;
  resetTime: number; // timestamp in milliseconds
  lastUpdated?: any; // Firestore timestamp
}

const RATE_LIMIT_COLLECTION = 'rateLimits';
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10;

/**
 * Check if an identifier is rate limited using Firestore for persistence
 * Works across serverless functions and multiple instances
 */
export async function checkRateLimit(
  identifier: string,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const { firestore } = getFirebaseAdmin();
    const now = Date.now();
    const rateLimitDocRef = doc(firestore, RATE_LIMIT_COLLECTION, identifier);
    
    const rateLimitSnap = await getDoc(rateLimitDocRef);
    let entry: FirestoreRateLimitEntry | null = null;
    
    if (rateLimitSnap.exists()) {
      entry = rateLimitSnap.data() as FirestoreRateLimitEntry;
    }
    
    // If no entry or reset time has passed, create new entry
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      await setDoc(rateLimitDocRef, entry);
    }
    
    // Increment count
    entry.count++;
    const remaining = Math.max(0, maxRequests - entry.count);
    const allowed = entry.count <= maxRequests;
    
    // Update the document with new count
    await updateDoc(rateLimitDocRef, {
      ...entry,
      // Update timestamp for expiry tracking
      lastUpdated: FieldValue.serverTimestamp()
    });
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  } catch (error) {
    // Fail closed - deny the request if rate limiting cannot be determined
    // This prevents attackers from bypassing limits by causing Firestore errors
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + windowMs
    };
  }
}

/**
 * Reset rate limit for an identifier (useful for testing or admin functions)
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const { firestore } = getFirebaseAdmin();
    const rateLimitDocRef = doc(firestore, RATE_LIMIT_COLLECTION, identifier);
    await deleteDoc(rateLimitDocRef);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Higher-order function to wrap handlers with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = args[0]?.userId || 
                      args[0]?.email || 
                      args[0]?.identifier || 
                      'anonymous';
    
    const result = await checkRateLimit(identifier, windowMs, maxRequests);
    if (!result.allowed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    return handler(...args);
  }) as T;
}

/**
 * Middleware-style function for use in API routes
 */
export function createRateLimitMiddleware(
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
) {
  return async (identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    return await checkRateLimit(identifier, windowMs, maxRequests);
  };
}

// Keep the old interface for compatibility but mark as deprecated
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

/**
 * @deprecated Use checkRateLimit instead
 */
export function checkRateLimitLegacy(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs, maxRequests, message: _message } = { ...defaultConfig, ...config };
  const now = Date.now();

  // Simple in-memory fallback for backward compatibility
  // Note: This is not persistent across serverless instances
  const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  
  let entry = rateLimitStore.get(identifier);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(identifier, entry);
  }

  if (entry) {
    entry.count++;
    const remaining = Math.max(0, maxRequests - entry.count);
    const allowed = entry.count <= maxRequests;
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }
  
  // Fallback
  return { allowed: true, remaining: maxRequests, resetTime: now + windowMs };
}

/**
 * @deprecated Use resetRateLimit instead
 */
export function resetRateLimitLegacy(identifier: string): void {
  // This would need access to the rateLimitStore from above
  // Keeping for compatibility but not functional
}

export function withRateLimitLegacy<T extends (...args: any[]) => any>(
  handler: T,
  config: RateLimitConfig = {}
): T {
  return ((...args: Parameters<T>) => {
    const identifier = args[0]?.userId || args[0]?.email || 'anonymous';
    const result = checkRateLimitLegacy(identifier, config);
    
    if (!result.allowed) {
      throw new Error(defaultConfig.message);
    }
    
    return handler(...args);
  }) as T;
}

export function createRateLimitMiddlewareLegacy(config: RateLimitConfig = {}) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    return checkRateLimitLegacy(identifier, config);
  };
}