const logger = require('../utils/logger');
const { startMessagePlanningJob } = require('./messagePlanning');
const { startQueueManagementJob } = require('./queueManagement');

// Start all cron jobs
const startCronJobs = () => {
    try {
        // Message planning job (02:00 daily)
        startMessagePlanningJob();

        // Queue management job (every minute)
        startQueueManagementJob();

        logger.info('All cron jobs started successfully');
    } catch (error) {
        logger.error('Error starting cron jobs:', error);
        throw error;
    }
};

// Stop cron jobs
const stopCronJobs = () => {
    // Cron jobs automatically stop when process ends
    logger.info('Cron jobs stopped');
};

// Get cron job status
const getCronJobStatus = () => {
    return {
        messagePlanning: 'Scheduled for 02:00 daily',
        queueManagement: 'Scheduled for every minute',
        status: 'Running',
    };
};

module.exports = {
    startCronJobs,
    stopCronJobs,
    getCronJobStatus,
};
