const User = require('../../models/user');
const { getRedisClient } = require('../../config/redis');

const connectionHandler = async (socket, io) => {
    try {
        // Add user to online list
        const redisClient = getRedisClient();
        await redisClient.sAdd('online_users', socket.user._id.toString());

        // Update user's online status
        await User.findByIdAndUpdate(socket.user._id, { isOnline: true, lastSeen: new Date() });

        // Join user's personal room
        socket.join(`user:${socket.user._id}`);

        // Broadcast user online status
        socket.broadcast.emit('user_online', {
            userId: socket.user._id,
            username: socket.user.username,
            timestamp: new Date(),
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.user.username} (${socket.user._id})`);

            // Remove user from online list
            await redisClient.sRem('online_users', socket.user._id.toString());

            // Update user's last seen
            await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastSeen: new Date() });

            // Broadcast user offline status
            socket.broadcast.emit('user_offline', {
                userId: socket.user._id,
                username: socket.user.username,
                timestamp: new Date(),
            });
        });
    } catch (error) {
        console.error('Connection handler error:', error);
    }
};

module.exports = connectionHandler;
