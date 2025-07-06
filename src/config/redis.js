const redis = require('redis');
let redisClient = null;

// Connect to Redis
const connectRedis = async () => {
    try {
        // Create Redis client
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('Redis connection failed after 10 retries');
                        return false; // Stop retrying
                    }
                    return Math.min(retries * 100, 3000); // Exponential backoff
                },
            },
        });

        // Error handling
        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        // Connection events
        redisClient.on('connect', () => {
            console.log('🟢 Redis Connected');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis Ready');
        });

        redisClient.on('end', () => {
            console.log('🔴 Redis Connection Ended');
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis Reconnecting...');
        });

        // Connect to Redis
        await redisClient.connect();

        // Test connection
        await redisClient.ping();
        console.log('🏓 Redis Ping Successful');
    } catch (error) {
        console.error('❌ Redis connection error:', error);
        throw error;
    }
};

// Get Redis client instance
const getRedisClient = () => {
    if (!redisClient) throw new Error('Redis client not initialized. Call connectRedis() first.');
    return redisClient;
};

// Close Redis connection
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        console.log('�� Redis Disconnected');
    }
};

module.exports = {
    connectRedis,
    getRedisClient,
    disconnectRedis,
};
