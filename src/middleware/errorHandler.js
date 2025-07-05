const logger = require('../utils/logger');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        error: err.message,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });

    let details = {};
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(err.errors).forEach((field) => {
            validationErrors[field] = err.errors[field].message;
        });

        statusCode = 400;
        message = 'Validation Error';
        details = validationErrors;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Not found';
    } else if (err.name === 'BadRequestError') {
        statusCode = 400;
        message = 'Bad request';
    } else if (err.name === 'InternalServerError') {
        statusCode = 500;
        message = 'Internal server error';
    } else if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate entry';
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        details: details,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
    });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
