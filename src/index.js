const logger = require('./utils/logger');
const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const connectDB = require('./config/database');

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // 10mb limit for json
app.use(express.urlencoded({ extended: true })); // extended: true for urlencoded

// Routes
app.use('/auth', authRoutes);

const server = app.listen(PORT, async () => {
    try {
        // Connect to databases
        await connectDB();

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
