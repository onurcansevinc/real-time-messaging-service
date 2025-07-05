const conversationHandler = (socket, io) => {
    // Handle conversation join
    socket.on('join_room', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.user.username} joined conversation: ${conversationId}`);
    });
};

module.exports = conversationHandler;
