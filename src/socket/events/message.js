const Message = require('../../models/message');
const Conversation = require('../../models/conversation');

const messageHandler = (socket, io) => {
    // Handle send message (real-time)
    socket.on('send_message', async (data) => {
        try {
            // Check if conversation exists
            const conversation = await Conversation.findById(data.conversationId);
            if (!conversation) return socket.emit('error', { message: 'Conversation not found' });

            // Create message
            const message = new Message({
                content: data.content,
                conversation: data.conversationId,
                sender: socket.user._id,
            });
            await message.save();

            // Broadcast to conversation room
            socket.to(`conversation:${data.conversationId}`).emit('message_received', {
                id: message._id,
                content: data.content,
                sender: {
                    id: socket.user._id,
                    username: socket.user.username,
                    avatar: socket.user.avatar,
                },
                conversationId: data.conversationId,
                createdAt: new Date(),
            });
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle message read
    socket.on('message_read', async (data) => {
        try {
            const { messageId } = data;

            // Find message and mark as read
            const message = await Message.findById(messageId);
            if (!message) return socket.emit('error', { message: 'Message not found' });

            // Check if user is participant of conversation
            const conversation = await Conversation.findById(message.conversation);
            if (!conversation.participants.includes(socket.user._id))
                return socket.emit('error', { message: 'You are not authorized to read this message' });

            // Mark message as read
            await message.markAsRead(socket.user._id);

            // Broadcast to conversation room
            socket.to(`conversation:${message.conversation}`).emit('message_read_by', {
                messageId: messageId,
                readBy: {
                    id: socket.user._id,
                    username: socket.user.username,
                },
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Message read error:', error);
            socket.emit('error', { message: 'Failed to mark message as read' });
        }
    });
};

module.exports = messageHandler;
