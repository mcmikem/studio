interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 10;

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

const defaultConfig: Required<RateLimitConfig> = {
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: DEFAULT_MAX_REQUESTS,
  message: 'Too many requests. Please try again later.',
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs, maxRequests, message: _message } = { ...defaultConfig, ...config };
  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(identifier, entry);
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

export function withRateLimit<T extends (...args: any[]) => any>(
  handler: T,
  config: RateLimitConfig = {}
): T {
  return ((...args: Parameters<T>) => {
    const identifier = args[0]?.userId || args[0]?.email || 'anonymous';
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      throw new Error(defaultConfig.message);
    }

    return handler(...args);
  }) as T;
}

export function createRateLimitMiddleware(config: RateLimitConfig = {}) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    return checkRateLimit(identifier, config);
  };
}
