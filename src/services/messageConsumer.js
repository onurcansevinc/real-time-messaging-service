const { getIO } = require('../socket');
const logger = require('../utils/logger');
const { getChannel } = require('../config/rabbitmq');

const Message = require('../models/message');
const Conversation = require('../models/conversation');

class MessageConsumer {
    // Start consuming messages
    static async startConsuming() {
        try {
            const channel = getChannel();

            // Consume from message sending queue
            await channel.consume('message_sending_queue', async (msg) => {
                if (msg) await this.processMessage(msg);
            });

            logger.info('Message consumer started');
        } catch (error) {
            logger.error('Error starting message consumer:', error);
            throw error;
        }
    }

    // Process individual message
    static async processMessage(msg) {
        const channel = getChannel();
        let messageData;

        try {
            // Parse message
            messageData = JSON.parse(msg.content.toString());

            // Create message in database
            const message = new Message({
                content: messageData.content,
                conversation: messageData.conversationId,
                sender: messageData.senderId,
                messageType: 'auto',
            });

            await message.save();

            // Update conversation
            await Conversation.findByIdAndUpdate(messageData.conversationId, {
                lastMessage: message._id,
                lastMessageAt: new Date(),
            });

            // TODO: Send real-time notification via Socket.IO

            // Acknowledge message
            channel.ack(msg);

            logger.info(`Message processed successfully: ${messageData.id}`);
        } catch (error) {
            logger.error('Error processing message:', error);
        }
    }
}

module.exports = MessageConsumer;
