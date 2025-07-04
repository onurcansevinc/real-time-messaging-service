const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

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
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, email, password } = req.body;

        // TODO: Check if user already exists

        // TODO: Hash password and create user

        // TODO: Generate JWT tokens

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Login a user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;

        // TODO: Find user and verify password

        // TODO: Generate JWT tokens

        return res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Refresh the access token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });

        // TODO: Verify refresh token and generate new access token
        return res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Logout a user and remove the token
router.post('/logout', async (req, res) => {
    try {
        // TODO: Implement logout logic (blacklist token, clear session, etc.)

        return res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Get the user details
router.get('/me', async (req, res) => {
    try {
        // TODO: Get user from auth middleware

        return res.json({ message: 'User profile retrieved' });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
