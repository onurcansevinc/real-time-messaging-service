const logger = require('./utils/logger');
const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { connectRabbitMQ } = require('./config/rabbitmq');

const { startCronJobs } = require('./cron');
const { initializeSocket } = require('./socket');
const MessageConsumer = require('./services/messageConsumer');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messagesRoutes = require('./routes/messages');
const conversationsRoutes = require('./routes/conversations');

const { notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter, messageLimiter } = require('./middleware/rateLimiter');

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // 10mb limit for json
app.use(express.urlencoded({ extended: true })); // extended: true for urlencoded

// health check
app.get('/api/health', generalLimiter, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', generalLimiter, userRoutes);
app.use('/api/messages', messageLimiter, messagesRoutes);
app.use('/api/conversations', generalLimiter, conversationsRoutes);

app.use(notFoundHandler);

const server = app.listen(PORT, async () => {
    try {
        // Connect to databases
        await connectDB();
        await connectRedis();
        await connectRabbitMQ();

        // Start cron jobs
        startCronJobs();

        // Start message consumer
        await MessageConsumer.startConsuming();

        initializeSocket(server);

        logger.info(`Server running on port ${PORT}`);
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
});

server.on('error', (error) => {
    logger.error('Server error:', error);
    process.exit(1);
});
