import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn("Upstash Redis 未配置，使用内存模拟");
      // 返回一个 mock 实例（开发环境兼容）
      redis = {
        get: async () => null,
        set: async () => "OK",
        del: async () => 1,
        exists: async () => 0,
        expire: async () => 1,
        incr: async () => 1,
        hget: async () => null,
        hset: async () => 1,
        hgetall: async () => ({}),
        zadd: async () => 1,
        zrange: async () => [],
        pipeline: () => ({
          exec: async () => [],
        }),
      } as unknown as Redis;
      return redis;
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

// 缓存工具函数
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
  try {
    await getRedis().set(key, value as never, { ex: ttlSeconds });
  } catch {
    // 缓存失败不抛出
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {
    // 忽略
  }
}
