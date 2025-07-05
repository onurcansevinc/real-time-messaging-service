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

            // Send to message sending queue with persistence
            await channel.sendToQueue('message_sending_queue', Buffer.from(JSON.stringify(message)), {
                persistent: true,
                headers: {
                    'x-retry-count': 0,
                },
            });

            logger.info(`Message sent to queue: ${message.id}`);
            return true;
        } catch (error) {
            logger.error('Error sending message to queue:', error);
            throw error;
        }
    }

    // Send message to retry queue
    static async sendToRetry(messageData) {
        try {
            const channel = getChannel();

            const retryMessage = {
                ...messageData,
                retryCount: (messageData.retryCount || 0) + 1,
                timestamp: new Date(),
            };

            await channel.sendToQueue('message_retry_queue', Buffer.from(JSON.stringify(retryMessage)), {
                persistent: true,
                headers: {
                    'x-retry-count': retryMessage.retryCount,
                },
            });

            logger.info(`Message sent to retry queue: ${messageData.id}, retry count: ${retryMessage.retryCount}`);
        } catch (error) {
            logger.error('Error sending message to retry queue:', error);
            throw error;
        }
    }

    // Send message to dead letter queue
    static async sendToDLQ(messageData) {
        try {
            const channel = getChannel();

            const dlqMessage = {
                ...messageData,
                failedAt: new Date(),
                reason: 'Max retry count exceeded',
            };

            await channel.sendToQueue('message_dlq_queue', Buffer.from(JSON.stringify(dlqMessage)), {
                persistent: true,
            });

            logger.warn(`Message sent to DLQ: ${messageData.id}`);
        } catch (error) {
            logger.error('Error sending message to DLQ:', error);
            throw error;
        }
    }
}

module.exports = MessageProducer;
