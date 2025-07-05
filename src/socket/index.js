const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');

const User = require('../models/user');
const logger = require('../utils/logger');

const messageHandler = require('./events/message');
const connectionHandler = require('./events/connection');
const TokenService = require('../services/tokenService');
const conversationHandler = require('./events/conversation');

let io;

const initializeSocket = (server) => {
    logger.info('Initializing socket.io');
    io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ['GET', 'POST'],
        },
    });

    logger.info('Socket.io initialized');

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

        messageHandler(socket, io);
        connectionHandler(socket, io);
        conversationHandler(socket, io);
    });

    return io;
};

// Utility functions
const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
};

module.exports = {
    initializeSocket,
    getIO,
};
