const logger = require('../utils/logger');
const { getChannel } = require('../config/rabbitmq');

class MessageProducer {
    // Send message to queue
    static async sendMessage(messageData) {
        try {
            const channel = getChannel();

            const message = {
                id: messageData.id,
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                content: messageData.content,
                conversationId: messageData.conversationId,
                sendDate: messageData.sendDate,
                retryCount: 0,
                timestamp: new Date(),
            };

            // Send to message sending queue
            await channel.sendToQueue('message_sending_queue', Buffer.from(JSON.stringify(message)));

            logger.info(`Message sent to queue: ${message.id}`);
            return true;
        } catch (error) {
            logger.error('Error sending message to queue:', error);
            throw error;
        }
    }
}

module.exports = MessageProducer;
