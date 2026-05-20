import { Redis } from "@upstash/redis";

// In-memory fallback for local dev when Upstash env vars aren't set
const memStore = new Map<string, unknown>();

const memFallback = {
  get: async <T>(key: string): Promise<T | null> => (memStore.get(key) as T) ?? null,
  set: async <T>(key: string, value: T, _opts?: unknown): Promise<void> => { memStore.set(key, value); },
  keys: async (pattern: string): Promise<string[]> => {
    const prefix = pattern.replace("*", "");
    return [...memStore.keys()].filter((k) => k.startsWith(prefix));
  },
};

function isConfigured(url?: string, token?: string) {
  return url && token && !url.includes("...") && !token.includes("...");
}

function makeRedis() {
  // Vercel's Upstash integration injects KV_REST_API_URL / KV_REST_API_TOKEN
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (isConfigured(url, token)) {
    return new Redis({ url, token });
  }
  return memFallback;
}

export const redis = makeRedis();
