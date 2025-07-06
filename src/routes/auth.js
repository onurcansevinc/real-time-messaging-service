const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const User = require('../models/user');
const TokenService = require('../services/tokenService');
const { cacheMiddleware } = require('../middleware/cache');
const { authenticateToken } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 */

// Validation middleware
const validateRegistration = [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
];

const validateLogin = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
router.post('/register', validateRegistration, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { username, email, password } = req.body;

        // Check if user already exists
        const userEmail = email.toLowerCase();
        const existingUser = await User.findOne({ $or: [{ email: userEmail }, { username }] }); // $or: or
        if (existingUser) return res.status(400).json({ success: false, error: 'User already exists' });

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ username, email: userEmail, password: hashedPassword });
        await user.save();

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        logger.error('Registration error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { email, password } = req.body;

        // Find user and verify password
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(400).json({ success: false, error: 'Invalid credentials' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ success: false, error: 'Invalid credentials' });

        // Add old token to blacklist
        const [_, token] = req.headers.authorization?.split(' ') || [];
        if (token) await TokenService.blacklistToken(token);

        // Generate JWT tokens
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, message: 'Login successful', accessToken });
    } catch (error) {
        logger.error('Login error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Add old token to blacklist
        const [_, token] = req.headers.authorization.split(' ');
        await TokenService.blacklistToken(token);

        // Generate new access token
        const accessToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, message: 'Token refreshed successfully', accessToken });
    } catch (error) {
        logger.error('Token refresh error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Server error
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Add old token to blacklist
        const [_, token] = req.headers.authorization.split(' ');
        await TokenService.blacklistToken(token);

        return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        logger.error('Logout error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, cacheMiddleware('user-profile'), async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        return res.json({
            success: true,
            message: 'User profile retrieved',
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
            },
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        return errorHandler(error, req, res);
    }
});

module.exports = router;
