const User = require('../../models/user');
const { getRedisClient } = require('../../config/redis');

const onlineUsersHandler = (socket, io) => {
    // Get online users list
    socket.on('get_online_users', async () => {
        try {
            const redisClient = getRedisClient();

            // Get online user IDs from Redis
            const onlineUserIds = await redisClient.sMembers('online_users');

            // Get user details from database
            const onlineUsers = await User.find({ _id: { $in: onlineUserIds } }).select(
                'username avatar isOnline lastSeen'
            );

            // Send online users list to requesting user
            socket.emit('online_users_list', {
                users: onlineUsers,
                count: onlineUsers.length,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Error getting online users:', error);
            socket.emit('error', { message: 'Failed to get online users' });
        }
    });

    // Broadcast online users update to all users
    const broadcastOnlineUsers = async () => {
        try {
            const redisClient = getRedisClient();

            // Get online user IDs from Redis
            const onlineUserIds = await redisClient.sMembers('online_users');

            // Get user details from database
            const onlineUsers = await User.find({ _id: { $in: onlineUserIds } });

            // Broadcast to all connected users
            io.emit('online_users_update', {
                users: onlineUsers,
                count: onlineUsers.length,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Error broadcasting online users:', error);
        }
    };

    // Broadcast when user connects
    socket.on('connection', () => {
        broadcastOnlineUsers();
    });

    // Broadcast when user disconnects
    socket.on('disconnect', () => {
        broadcastOnlineUsers();
    });
};

module.exports = onlineUsersHandler;
