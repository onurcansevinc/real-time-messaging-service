const logger = require('../utils/logger');
const { getRedisClient } = require('./redis');

class CacheService {
    constructor() {
        this.client = null;
        this.defaultTTL = 300; // 5 minutes
    }

    // Initialize cache service
    init() {
        try {
            this.client = getRedisClient();
            logger.info('Cache service initialized');
            return true;
        } catch (error) {
            logger.error('Cache service initialization failed:', error);
            return false;
        }
    }

    // Generate cache key
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map((key) => `${key}:${params[key]}`)
            .join(':');

        return sortedParams ? `${prefix}:${sortedParams}` : prefix;
    }

    // Get value from cache
    async get(key) {
        try {
            if (!this.client) return null;

            const value = await this.client.get(key);

            if (value) {
                logger.debug(`Cache HIT: ${key}`);
                return JSON.parse(value);
            }

            logger.debug(`Cache MISS: ${key}`);
            return null;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    // Set value in cache
    async set(key, value, ttl = this.defaultTTL) {
        try {
            if (!this.client) return false;

            const serializedValue = JSON.stringify(value);

            if (ttl > 0) {
                await this.client.setEx(key, ttl, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }

            logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    // Delete cache key
    async del(key) {
        try {
            if (!this.client) return false;

            const result = await this.client.del(key);
            if (result > 0) {
                logger.debug(`Cache DEL: ${key}`);
            }
            return result > 0;
        } catch (error) {
            logger.error(`Cache del error for key ${key}:`, error);
            return false;
        }
    }

    // Delete multiple keys by pattern
    async delPattern(pattern) {
        try {
            if (!this.client) return 0;

            const keys = await this.client.keys(pattern);

            if (keys.length > 0) {
                const result = await this.client.del(keys);
                logger.debug(`Cache DEL PATTERN: ${pattern} (${result} keys deleted)`);
                return result;
            }

            return 0;
        } catch (error) {
            logger.error(`Cache delPattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }

    // Invalidate cache by prefix
    async invalidate(prefix) {
        return await this.delPattern(`${prefix}:*`);
    }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
