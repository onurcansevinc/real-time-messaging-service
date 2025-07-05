const cron = require('node-cron');
const logger = require('../utils/logger');
const AutoMessage = require('../models/autoMessage');
const MessageProducer = require('../services/messageProducer');

// Queue management process
const manageQueue = async () => {
    try {
        logger.info('Starting queue management job...');

        // Find messages that are ready to be sent (sendDate passed and not queued)
        const pendingMessages = await AutoMessage.find({
            sendDate: { $lte: new Date() }, // sendDate has passed (lte: less than or equal to)
            isQueued: false, // not yet queued
            isSent: false, // not yet sent
        })
            .populate('senderId', 'username') // Populate senderId with username
            .populate('receiverId', 'username'); // Populate receiverId with username

        if (pendingMessages.length === 0) {
            logger.info('No pending messages found');
            return;
        }

        logger.info(`Found ${pendingMessages.length} pending messages`);

        // Process each message
        for (const autoMessage of pendingMessages) {
            try {
                // Send to RabbitMQ queue
                await MessageProducer.sendMessage({
                    id: autoMessage._id.toString(),
                    senderId: autoMessage.senderId._id,
                    receiverId: autoMessage.receiverId._id,
                    content: autoMessage.content,
                    conversationId: autoMessage.conversationId,
                    sendDate: autoMessage.sendDate,
                });

                // Mark as queued to prevent reprocessing
                await autoMessage.markAsQueued();

                logger.info(
                    `Message ${autoMessage._id} sent to queue from ${autoMessage.senderId.username} to ${autoMessage.receiverId.username}`
                );
            } catch (error) {
                logger.error(`Error sending message ${autoMessage._id} to queue:`, error);

                // Mark as failed to prevent infinite retries
                await autoMessage.markAsFailed(error.message);
            }
        }

        logger.info(`Queue management job completed. Processed ${pendingMessages.length} messages`);
    } catch (error) {
        logger.error('Error in queue management job:', error);
    }
};

// Start cron job (every minute)
const startQueueManagementJob = () => {
    cron.schedule(
        '* * * * *', // Every minute
        async () => {
            await manageQueue();
        },
        {
            scheduled: true,
            timezone: 'Europe/Istanbul',
        }
    );

    logger.info('Queue management cron job scheduled for every minute');
};

// Manual trigger for testing
const triggerQueueManagement = async () => {
    logger.info('Manually triggering queue management...');
    await manageQueue();
};

module.exports = {
    startQueueManagementJob,
    manageQueue,
    triggerQueueManagement, // For testing
};
