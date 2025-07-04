const { getRedisClient } = require('../config/redis');

class TokenService {
    // Add token to blacklist
    static async blacklistToken(token) {
        const client = getRedisClient();
        await client.set(`blacklist:${token}`, 'true');
    }

    // Check if token is blacklisted
    static async isBlacklisted(token) {
        const client = getRedisClient();
        const result = await client.get(`blacklist:${token}`);
        return result === 'true';
    }
}

module.exports = TokenService;
