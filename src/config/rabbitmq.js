const amqp = require('amqplib');
const logger = require('../utils/logger');

let connection = null;
let channel = null;

// Create a connection to RabbitMQ
const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue('message_sending_queue');
        logger.info('Connected to RabbitMQ');

        channel.sendToQueue('message_sending_queue', Buffer.from('Hello World'));
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

// Get the RabbitMQ channel
const getChannel = () => {
    if (!channel) throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ() first.');
    return channel;
};

// Close RabbitMQ connection
const closeRabbitMQ = async () => {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        logger.info('RabbitMQ connection closed');
    } catch (error) {
        logger.error('Error closing RabbitMQ connection:', error);
    }
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    closeRabbitMQ,
};
