const cacheService = require('../config/cache');
const logger = require('../utils/logger');

// Cache middleware for API responses
const cacheMiddleware = (prefix, ttl = 300) => {
    return async (req, res, next) => {
        // Skip cache for non-GET requests
        if (req.method !== 'GET') return next();

        // Skip cache if explicitly disabled
        if (req.query.nocache === 'true') return next();

        try {
            // Generate cache key
            const params = {
                ...req.params,
                ...req.query,
                user: req.user?._id?.toString(),
            };
            const cacheKey = cacheService.generateKey(prefix, params);

            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                logger.info(`Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            // Cache miss - store original send method
            const originalSend = res.json;

            // Override res.json to cache the response
            res.json = function (data) {
                // Restore original method
                res.json = originalSend;

                // Cache the response
                cacheService
                    .set(cacheKey, data, ttl)
                    .then(() => {
                        logger.info(`Cache SET: ${cacheKey}`);
                    })
                    .catch((error) => {
                        logger.error(`Cache SET failed for ${cacheKey}:`, error);
                    });

                // Send response
                return originalSend.call(this, data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            next(); // Continue without cache on error
        }
    };
};

// Cache invalidation middleware
const invalidateCache = (prefix) => {
    return async (req, res, next) => {
        try {
            await cacheService.invalidate(prefix);
            logger.info(`Cache invalidated: ${prefix}`);
            next();
        } catch (error) {
            logger.error(`Cache invalidation error for ${prefix}:`, error);
            next(); // Continue even if cache invalidation fails
        }
    };
};

module.exports = {
    cacheMiddleware,
    invalidateCache,
};
