const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const User = require('../models/user');
const TokenService = require('../services/tokenService');
const { authenticateToken } = require('../middleware/auth');

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

// Register a new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, error: 'User already exists' });

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ username, email, password: hashedPassword });
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
        console.error('Registration error:', error);

        if (error.name === 'ValidationError') {
            const validationErrors = {};

            // Extract field-specific errors
            Object.keys(error.errors).forEach((field) => {
                validationErrors[field] = error.errors[field].message;
            });

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Please check your input data',
                details: validationErrors,
            });
        }

        // Handle other errors
        return res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'An unexpected error occurred. Please try again later.',
        });
    }
});

// Login a user
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
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ success: true, message: 'Login successful', accessToken });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Refresh the access token
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Add old token to blacklist
        const [_, token] = req.headers.authorization.split(' ');
        await TokenService.blacklistToken(token);

        // Generate new access token
        const accessToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, message: 'Token refreshed successfully', accessToken });
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
});

// Logout a user and remove the token
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Add old token to blacklist
        const [_, token] = req.headers.authorization.split(' ');
        await TokenService.blacklistToken(token);

        return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get the user details
router.get('/me', authenticateToken, async (req, res) => {
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
        console.error('Get profile error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
