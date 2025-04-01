import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache: { [key: string]: CacheEntry<any> } = {};
  private defaultExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    // Try to restore cache from sessionStorage on initialization
    const savedCache = sessionStorage.getItem('appDataCache');
    if (savedCache) {
      try {
        this.cache = JSON.parse(savedCache);

        // Clean up any expired cache entries
        this.cleanExpiredCache();
      } catch (e) {
        console.error('Error parsing cached data', e);
        sessionStorage.removeItem('appDataCache');
        this.cache = {};
      }
    }
  }

  /**
   * Get cached data if available and not expired
   * @param key The cache key
   * @param expiration Optional custom expiration time in milliseconds
   * @returns The cached data or null if not found or expired
   */
  get<T>(key: string, expiration?: number): T | null {
    const cacheEntry = this.cache[key];
    const expirationTime = expiration || this.defaultExpiration;

    // If entry exists and isn't expired, return the data
    if (cacheEntry && Date.now() - cacheEntry.timestamp < expirationTime) {
      return cacheEntry.data;
    }

    // No valid cache entry found
    return null;
  }

  /**
   * Save data to the cache
   * @param key The cache key
   * @param data The data to cache
   */
  set<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };

    // Save to sessionStorage for persistence
    this.saveToStorage();
  }

  /**
   * Remove a specific entry from the cache
   * @param key The cache key to remove
   */
  remove(key: string): void {
    if (this.cache[key]) {
      delete this.cache[key];
      this.saveToStorage();
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache = {};
    sessionStorage.removeItem('appDataCache');
  }

  /**
   * Clear all cached data for a specific prefix
   * @param keyPrefix The prefix to match for keys to clear
   */
  clearByPrefix(keyPrefix: string): void {
    const keysToRemove = Object.keys(this.cache).filter((key) =>
      key.startsWith(keyPrefix)
    );

    keysToRemove.forEach((key) => {
      delete this.cache[key];
    });

    this.saveToStorage();
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @param expiration Optional custom expiration time in milliseconds
   * @returns True if the key exists and is not expired
   */
  has(key: string, expiration?: number): boolean {
    return this.get(key, expiration) !== null;
  }

  /**
   * Remove all expired entries from the cache
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Find expired keys
    Object.keys(this.cache).forEach((key) => {
      if (now - this.cache[key].timestamp > this.defaultExpiration) {
        keysToRemove.push(key);
      }
    });

    // Remove expired keys
    keysToRemove.forEach((key) => {
      delete this.cache[key];
    });

    // Save clean cache to sessionStorage
    if (keysToRemove.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Save the current cache to sessionStorage
   */
  private saveToStorage(): void {
    try {
      sessionStorage.setItem('appDataCache', JSON.stringify(this.cache));
    } catch (e) {
      console.error('Error saving cache to sessionStorage', e);
    }
  }
}
