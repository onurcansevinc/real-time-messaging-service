const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
            match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password in queries by default
        },
        avatar: {
            type: String,
            default: null,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        refreshTokens: [
            {
                token: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                    expires: 7 * 24 * 60 * 60, // 7 days
                },
            },
        ],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
