const cron = require('node-cron');
const logger = require('../utils/logger');

const User = require('../models/user');
const AutoMessage = require('../models/autoMessage');
const Conversation = require('../models/conversation');

// Random message templates
const MESSAGE_TEMPLATES = [
    'Merhaba! Nasılsın?',
    'Günaydın! Bugün nasıl geçiyor?',
    'İyi akşamlar! Günün nasıl geçti?',
    'Selam! Ne yapıyorsun?',
    'Hey! Uzun zamandır görüşemedik.',
    'Merhaba! Yeni bir gün başladı.',
    'Selamlar! Bugün hava nasıl?',
    'Hey! Nasıl gidiyor hayat?',
    'Merhaba! Bugün planların neler?',
    'Selam! Umarım iyisindir.',
];

// Random message selection
const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * MESSAGE_TEMPLATES.length);
    return MESSAGE_TEMPLATES[randomIndex];
};

// Shuffle user list
const shuffleUsers = (users) => {
    const shuffled = [...users];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Create random send time (between 09:00 and 18:00 today)
const getRandomSendTime = () => {
    const today = new Date();

    const randomHour = Math.floor(Math.random() * 24);
    const randomMinute = Math.floor(Math.random() * 60);

    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), randomHour, randomMinute);
};

// Message planning process
const planMessages = async () => {
    try {
        logger.info('Starting message planning job...');

        // Get active users
        const activeUsers = await User.find({ isActive: true }).select('_id username');
        if (activeUsers.length < 2) {
            logger.warn('Not enough active users for message planning');
            return;
        }

        logger.info(`Found ${activeUsers.length} active users`);

        // Shuffle users
        const shuffledUsers = shuffleUsers(activeUsers);

        // Create pairs of users
        const pairs = [];
        // Split users into pairs (2 users per pair)
        for (let i = 0; i < shuffledUsers.length - 1; i += 2) {
            pairs.push([shuffledUsers[i], shuffledUsers[i + 1]]);
        }

        // If there is one user left, pair it with the first user (odd number of users)
        if (shuffledUsers.length % 2 === 1) {
            pairs.push([shuffledUsers[0], shuffledUsers[shuffledUsers.length - 1]]);
        }

        logger.info(`Created ${pairs.length} user pairs`);

        // Plan messages for each pair
        const autoMessages = [];

        for (const [user1, user2] of pairs) {
            try {
                // Create conversation or find existing one
                const conversation = await Conversation.findOrCreateDirect(user1._id, user2._id);

                // Random message content and send time
                const content = getRandomMessage();
                const sendDate = getRandomSendTime();

                // Create AutoMessage
                const autoMessage = new AutoMessage({
                    content,
                    senderId: user1._id,
                    receiverId: user2._id,
                    conversationId: conversation._id,
                    sendDate,
                });

                // DO NOT USE DATABASE ACTIONS IN FOR LOOP, USE BULK INSERTION INSTEAD
                autoMessages.push(autoMessage);

                logger.info(`Planned message from ${user1.username} to ${user2.username} at ${sendDate}`);
            } catch (error) {
                logger.error(`Error planning message for pair ${user1.username}-${user2.username}:`, error);
            }
        }

        // Save all messages to database
        if (autoMessages.length > 0) {
            await AutoMessage.insertMany(autoMessages);
            logger.info(`Successfully planned ${autoMessages.length} messages`);
        }

        logger.info('Message planning job completed');
    } catch (error) {
        logger.error('Error in message planning job:', error);
    }
};

// Start cron job (every day at 02:00)
const startMessagePlanningJob = () => {
    cron.schedule(
        '0 2 * * *',
        async () => {
            logger.info('Message planning cron job triggered');
            await planMessages();
        },
        {
            scheduled: true,
            timezone: 'Europe/Istanbul',
        }
    );

    logger.info('Message planning cron job scheduled for 02:00 daily');
};

module.exports = {
    startMessagePlanningJob,
    planMessages, // For testing
};
