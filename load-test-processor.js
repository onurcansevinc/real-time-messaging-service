// Artillery processor functions for load testing

/**
 * Generate random user credentials for load testing
 */
function generateUserCredentials(context, events, done) {
    // Generate unique username and email using timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const userId = `loadtest_${timestamp}_${random}`;

    context.vars.username = userId;
    context.vars.email = `${userId}@loadtest.local`;
    context.vars.password = 'LoadTest123!';

    return done();
}

/**
 * Get a random user ID from the captured user list
 */
function getRandomUserId(context, events, done) {
    // If we have captured user IDs, pick a random one
    if (context.vars.userIds && Array.isArray(context.vars.userIds) && context.vars.userIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * context.vars.userIds.length);
        context.vars.targetUserId = context.vars.userIds[randomIndex];
    } else if (context.vars.userId) {
        // Fallback to captured userId
        context.vars.targetUserId = context.vars.userId;
    } else {
        // Last resort: use a placeholder (this might fail, but that's okay for load testing)
        context.vars.targetUserId = '000000000000000000000000';
    }

    return done();
}

/**
 * Generate random message content
 */
function generateMessageContent(context, events, done) {
    const messages = [
        'Hello, this is a load test message',
        'Testing system under load',
        'Message content for performance testing',
        'Load test message number {{ $randomInt() }}',
        'Real-time messaging system test',
        'Checking system scalability',
        'Performance and load testing',
        'Testing 10K+ concurrent users',
        'Message at {{ $timestamp }}',
        'Concurrent user simulation',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    context.vars.messageContent = randomMessage;

    return done();
}

module.exports = {
    generateUserCredentials,
    getRandomUserId,
    generateMessageContent,
};
