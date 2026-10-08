import { Redis } from 'ioredis'
import { config } from '../config.js'

let redisClient: Redis | null = null
let isConnected = false

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient
  }

  if (!config.REDIS_URL) {
    return null
  }

  try {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null // Stop retrying after 3 attempts
        return Math.min(times * 100, 2000)
      },
    })

    redisClient.on('connect', () => {
      isConnected = true
    })

    redisClient.on('error', () => {
      isConnected = false
    })

    redisClient.on('close', () => {
      isConnected = false
    })

    return redisClient
  } catch {
    return null
  }
}

export function setMockRedisClient(client: Redis | null) {
  redisClient = client
  isConnected = !!client
}

const DEFAULT_TTL_SECONDS = 300 // 5 minutes

/**
 * Cache-Aside Helper with Circuit Breaker and O(1) Versioned Invalidation
 */
export const CacheService = {
  /**
   * Retrieves current catalog cache version tag for O(1) invalidation
   */
  async getCatalogVersion(): Promise<string> {
    const client = getRedisClient()
    if (!client || !isConnected) return 'v1'

    try {
      const version = await client.get('catalog:version')
      if (!version) {
        await client.set('catalog:version', '1')
        return '1'
      }
      return version
    } catch {
      return 'v1'
    }
  },

  /**
   * Increments catalog cache version tag, instantly invalidating all cached catalog queries in O(1)
   */
  async invalidateCatalog(): Promise<boolean> {
    const client = getRedisClient()
    if (!client || !isConnected) return false

    try {
      await client.incr('catalog:version')
      return true
    } catch {
      return false
    }
  },

  /**
   * Retrieves data from Redis cache. Returns null on cache miss or connection error.
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    if (!client || !isConnected) return null

    try {
      const cached = await client.get(key)
      if (!cached) return null
      return JSON.parse(cached) as T
    } catch {
      return null
    }
  },

  /**
   * Stores data in Redis cache with TTL + jitter to prevent cache stampede
   */
  async set(key: string, value: any, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<boolean> {
    const client = getRedisClient()
    if (!client || !isConnected) return false

    try {
      // Add random jitter (0 to 30 seconds) to prevent concurrent expiration
      const jitter = Math.floor(Math.random() * 30)
      const finalTtl = ttlSeconds + jitter

      await client.set(key, JSON.stringify(value), 'EX', finalTtl)
      return true
    } catch {
      return false
    }
  },
}
