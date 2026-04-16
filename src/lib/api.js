import axios from "axios";

const api = axios.create({
  baseURL:
    // process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://quiz-be-k7hj.onrender.com",
  // ||
  // "http://localhost:8000",
});

const responseCache = new Map();
const DEFAULT_CACHE_TTL = 30 * 1000;

const buildCacheKey = (url, config = {}) =>
  JSON.stringify({
    url,
    params: config.params || {},
    headers: config.headers || {},
  });

export const getCached = async (url, config = {}, ttl = DEFAULT_CACHE_TTL) => {
  const key = buildCacheKey(url, config);
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const requestPromise = api.get(url, config).catch((error) => {
    responseCache.delete(key);
    throw error;
  });

  responseCache.set(key, {
    promise: requestPromise,
    expiresAt: now + ttl,
  });

  return requestPromise;
};

export const clearApiCache = (matcher) => {
  if (!matcher) {
    responseCache.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (typeof matcher === "string" && key.includes(matcher)) {
      responseCache.delete(key);
    }

    if (typeof matcher === "function" && matcher(key)) {
      responseCache.delete(key);
    }
  }
};

export default api;
