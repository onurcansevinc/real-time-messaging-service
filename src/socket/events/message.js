const messageHandler = (socket, io) => {
    // Handle send message (real-time)
    socket.on('send_message', (data) => {
        // Broadcast to conversation room
        socket.to(`conversation:${data.conversationId}`).emit('message_received', {
            id: data.messageId,
            content: data.content,
            sender: {
                id: socket.user._id,
                username: socket.user.username,
                avatar: socket.user.avatar,
            },
            conversationId: data.conversationId,
            createdAt: new Date(),
        });
    });
};

module.exports = messageHandler;
