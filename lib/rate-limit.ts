import { NextResponse } from "next/server";

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const store = new Map<string, RateLimitState>();

function now() {
  return Date.now();
}

function pruneExpiredEntries(currentTime: number) {
  if (store.size < 5000) {
    return;
  }

  for (const [key, value] of store.entries()) {
    if (value.resetAt <= currentTime) {
      store.delete(key);
    }
  }
}

export function getRequestRateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return `${scope}:${ip}`;
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitInput): RateLimitResult {
  const currentTime = now();
  pruneExpiredEntries(currentTime);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= currentTime) {
    store.set(key, { count: 1, resetAt: currentTime + windowMs });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: currentTime + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}
