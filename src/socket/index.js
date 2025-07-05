const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');
const { getRedisClient } = require('../config/redis');

const User = require('../models/user');
const TokenService = require('../services/tokenService');

let io;

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ['GET', 'POST'],
        },
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
            if (!token) return next(new Error('Authentication error: No token provided'));

            const [_, cleanToken] = token.split(' ');
            if (!cleanToken) return next(new Error('Authentication error: No token provided'));

            const isBlacklisted = await TokenService.isBlacklisted(cleanToken);
            if (isBlacklisted) return next(new Error('Authentication error: Token is blacklisted'));

            // Verify JWT token
            const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

            // Get user from database
            const user = await User.findById(decoded.userId);
            if (!user) return next(new Error('Authentication error: User not found'));

            // Add user to socket
            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.user._id})`);
    });

    return io;
};

// Utility functions
const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
};

// Send message to conversation
const sendMessageToConversation = (conversationId, messageData) => {
    if (io) io.to(`conversation:${conversationId}`).emit('message_received', messageData);
};

// Send notification to user
const sendNotificationToUser = (userId, notificationData) => {
    if (io) io.to(`user:${userId}`).emit('notification', notificationData);
};

// Get online users count
const getOnlineUsersCount = async () => {
    try {
        const redisClient = getRedisClient();
        return await redisClient.sCard('online_users');
    } catch (error) {
        console.error('Error getting online users count:', error);
        return 0;
    }
};

module.exports = {
    initializeSocket,
    getIO,
    sendMessageToConversation,
    sendNotificationToUser,
    getOnlineUsersCount,
};
