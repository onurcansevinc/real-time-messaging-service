const typingHandler = (socket, io) => {
    const typingUsers = new Map(); // Store typing users with timeout

    // Handle typing start
    socket.on('typing_start', (data) => {
        const { conversationId } = data;
        const userId = socket.user._id.toString();
        const key = `${conversationId}:${userId}`;

        // Clear existing timeout
        if (typingUsers.has(key)) clearTimeout(typingUsers.get(key));

        // Broadcast typing start
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
            userId: socket.user._id,
            username: socket.user.username,
            conversationId: conversationId,
            timestamp: new Date(),
        });

        // Set timeout to stop typing after 3 seconds
        const timeout = setTimeout(() => {
            typingUsers.delete(key);
            socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
                userId: socket.user._id,
                username: socket.user.username,
                conversationId: conversationId,
                timestamp: new Date(),
            });
        }, 3000);

        typingUsers.set(key, timeout);
    });

    // Handle typing stop
    socket.on('typing_stop', (data) => {
        const { conversationId } = data;
        const userId = socket.user._id.toString();
        const key = `${conversationId}:${userId}`;

        // Clear timeout
        if (typingUsers.has(key)) {
            clearTimeout(typingUsers.get(key));
            typingUsers.delete(key);
        }

        // Broadcast typing stop
        socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
            userId: socket.user._id,
            username: socket.user.username,
            conversationId: conversationId,
            timestamp: new Date(),
        });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        // Clear all timeouts for this user
        for (const [key, timeout] of typingUsers.entries()) {
            if (key.includes(socket.user._id.toString())) {
                clearTimeout(timeout);
                typingUsers.delete(key);
            }
        }
    });
};

module.exports = typingHandler;
