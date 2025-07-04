const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { redisServices } = require('../config/redis');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Access denied',
                message: 'No authorization header provided',
            });
        }

        // Check if it's Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token format',
                message: 'Token must be in Bearer format',
            });
        }

        // Extract token (remove "Bearer " prefix)
        const accessToken = authHeader.substring(7);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                error: 'Access denied',
                message: 'No token provided',
            });
        }

        // Check if token is blacklisted
        const isBlacklisted = await redisServices.blacklist.isBlacklisted(accessToken);
        if (isBlacklisted) return res.status(401).json({ success: false, error: 'Token is blacklisted' });

        // Verify token
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        // Check if user still exists in database
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'User not found',
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'Token is not valid',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'Access token has expired. Please refresh your token',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: 'An error occurred during authentication',
        });
    }
};

module.exports = {
    authenticateToken,
};
