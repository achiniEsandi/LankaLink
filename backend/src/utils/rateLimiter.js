// Small in-memory limiter: counts events per key inside a fixed window.
// Kept dependency-free on purpose. Limits reset when the server restarts and are
// per server process, which is fine for a single backend instance.
const limiters = new Set();

export function createLimiter({ max, windowMs }) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, 60_000);
  sweep.unref();

  const live = (key) => {
    const entry = hits.get(key);
    if (entry && entry.resetAt > Date.now()) return entry;
    hits.delete(key);
    return null;
  };

  const limiter = {
    // Milliseconds until the key may try again, or 0 if it is not blocked
    blockedFor(key) {
      const entry = live(key);
      return entry && entry.count >= max ? entry.resetAt - Date.now() : 0;
    },
    hit(key) {
      const entry = live(key) ?? { count: 0, resetAt: Date.now() + windowMs };
      entry.count += 1;
      hits.set(key, entry);
      return entry.count;
    },
    reset(key) {
      hits.delete(key);
    },
    clear() {
      hits.clear();
    },
  };
  limiters.add(limiter);
  return limiter;
}

// Used by tests to start each case with clean counters
export function clearAllLimits() {
  for (const limiter of limiters) limiter.clear();
}

export const minutesLeft = (ms) => Math.max(1, Math.ceil(ms / 60_000));
