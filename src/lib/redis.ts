// Redis with in-memory fallback for local dev

let redis: import("ioredis").Redis | null = null;
const memoryStore = new Map<string, { value: string; expiry: number }>();

async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    const { Redis } = await import("ioredis");
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2000,
    });
    redis.on("error", () => { redis = null; });
  }
  return redis;
}

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const client = await getRedis().catch(() => null);
  const now = Date.now();

  if (!client) {
    // In-memory fallback
    const entry = memoryStore.get(key);
    if (!entry || entry.expiry < now) {
      memoryStore.set(key, { value: "1", expiry: now + windowMs });
      return { success: true, remaining: max - 1, reset: now + windowMs };
    }
    const count = parseInt(entry.value) + 1;
    memoryStore.set(key, { value: String(count), expiry: entry.expiry });
    return { success: count <= max, remaining: Math.max(0, max - count), reset: entry.expiry };
  }

  try {
    const multi = client.multi();
    multi.zremrangebyscore(key, 0, now - windowMs);
    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.zcard(key);
    multi.pexpire(key, windowMs);
    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;
    return { success: count <= max, remaining: Math.max(0, max - count), reset: now + windowMs };
  } catch {
    return { success: true, remaining: max, reset: now + windowMs };
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = await getRedis().catch(() => null);
  if (!client) {
    const entry = memoryStore.get(key);
    if (!entry || entry.expiry < Date.now()) return null;
    return JSON.parse(entry.value) as T;
  }
  try {
    const val = await client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch { return null; }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = await getRedis().catch(() => null);
  const serialized = JSON.stringify(value);
  if (!client) {
    memoryStore.set(key, { value: serialized, expiry: Date.now() + ttlSeconds * 1000 });
    return;
  }
  try { await client.setex(key, ttlSeconds, serialized); } catch { }
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = await getRedis().catch(() => null);
  if (!client) {
    for (const key of memoryStore.keys()) {
      if (key.includes(pattern.replace("*", ""))) memoryStore.delete(key);
    }
    return;
  }
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch { }
}
