// Simple in-memory rate limiter so a public demo can't burn through the
// API budget. On serverless hosts each instance keeps its own counts, so
// this is a soft limit. For a stricter one, use Upstash Redis or similar.

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_HOUR ?? 15);

const hits = new Map<string, number[]>();

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
