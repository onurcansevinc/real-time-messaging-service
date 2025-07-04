const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user');

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
        console.error('Get users error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
