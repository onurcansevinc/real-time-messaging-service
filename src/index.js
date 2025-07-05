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

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // 10mb limit for json
app.use(express.urlencoded({ extended: true })); // extended: true for urlencoded

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/conversations', conversationsRoutes);

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
