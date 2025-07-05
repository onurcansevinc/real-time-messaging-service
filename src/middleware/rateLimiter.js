const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// General API rate limiter - limits all API requests per IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    skip: (req) => {
        // Skip rate limiting for health check
        return req.path === '/health';
    },
    handler: (req, res) => {
        logger.warn('General rate limit exceeded:', {
            ip: req.ip,
            url: req.url,
            userAgent: req.get('User-Agent'),
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: Math.ceil((15 * 60) / 60), // minutes
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Authentication rate limiter - stricter limits for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded:', {
            ip: req.ip,
            url: req.url,
            userAgent: req.get('User-Agent'),
        });
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts',
            message: 'Too many login/register attempts. Please try again later.',
            retryAfter: Math.ceil((15 * 60) / 60),
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Message sending rate limiter - limits message sending per user
const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each user to 10 messages per minute
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        return req.user ? req.user._id.toString() : req.ip;
    },
    skip: (req) => {
        // Skip rate limiting for system messages
        return req.body?.messageType === 'auto';
    },
    handler: (req, res) => {
        logger.warn('Message rate limit exceeded:', {
            userId: req.user?._id,
            ip: req.ip,
            url: req.url,
        });
        res.status(429).json({
            success: false,
            error: 'Message rate limit exceeded',
            message: 'You are sending messages too quickly. Please slow down.',
            retryAfter: Math.ceil((1 * 60) / 60),
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    messageLimiter,
};
