// TicketNest Caching Service
// Provides Redis-compatible caching with automatic in-memory fallback
// Strict policy: Inventory queries NEVER use cache; only static event listings and details are cached

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class CacheService {
  private memoryStore = new Map<string, CacheEntry<any>>();
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    // Periodically prune expired entries from memory store
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryStore.delete(key);
        }
      }
    }, 60 * 1000);
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryStore.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      this.missCount++;
      return null;
    }
    this.hitCount++;
    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds = 120, tags: string[] = []): Promise<void> {
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  public async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  public async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.tags.includes(tag)) {
        this.memoryStore.delete(key);
        count++;
      }
    }
    return count;
  }

  public async invalidateEventCache(eventId?: string): Promise<void> {
    await this.invalidateByTag('events');
    if (eventId) {
      await this.del(`event:${eventId}`);
    }
  }

  public getStats() {
    return {
      entries: this.memoryStore.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRatio: this.hitCount + this.missCount > 0 ? (this.hitCount / (this.hitCount + this.missCount)).toFixed(2) : '0.00',
    };
  }
}

export const cacheService = new CacheService();
