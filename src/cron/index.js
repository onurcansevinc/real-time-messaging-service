const logger = require('../utils/logger');
const { startMessagePlanningJob, planMessages } = require('./messagePlanning');

// Start all cron jobs
const startCronJobs = () => {
    try {
        // Message planning job (02:00)
        startMessagePlanningJob();

        logger.info('All cron jobs started successfully');
    } catch (error) {
        logger.error('Error starting cron jobs:', error);
        throw error;
    }
};

// Stop all cron jobs
const stopCronJobs = () => {
    // Cron jobs are automatically stopped
    logger.info('Cron jobs stopped');
};

module.exports = {
    startCronJobs,
    stopCronJobs,
};
