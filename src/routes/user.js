const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

const User = require('../models/user');

const { authenticateToken } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');

// Get the users
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}).select('-__v');

        return res.json({
            success: true,
            message: 'Users retrieved',
            users,
            count: users.length,
        });
    } catch (error) {
        logger.error('Get users error:', error);
        return errorHandler(error, req, res);
    }
});

module.exports = router;
