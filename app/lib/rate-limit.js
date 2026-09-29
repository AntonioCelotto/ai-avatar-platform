const buckets = globalThis.__avatarOneRateBuckets || new Map();
globalThis.__avatarOneRateBuckets = buckets;

export function requestIp(request) {
  return String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown")
    .split(",")[0]
    .trim()
    .slice(0, 80);
}

export function enforceRateLimit(request, scope, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const key = `${scope}:${requestIp(request)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return Response.json(
      { error: "Troppe richieste. Riprova tra poco." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
    );
  }
  current.count += 1;
  return null;
}
