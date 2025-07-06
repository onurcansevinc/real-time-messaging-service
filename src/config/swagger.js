const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Real-Time Messaging API',
            version: '1.0.0',
            description: 'A real-time messaging system with Express, Socket.IO, and RabbitMQ',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://api.example.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'User ID',
                        },
                        username: {
                            type: 'string',
                            description: 'Username',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email',
                        },
                        isOnline: {
                            type: 'boolean',
                            description: 'Online status',
                        },
                        lastSeen: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last seen timestamp',
                        },
                    },
                },
                Message: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Message ID',
                        },
                        content: {
                            type: 'string',
                            description: 'Message content',
                        },
                        sender: {
                            $ref: '#/components/schemas/User',
                        },
                        conversation: {
                            type: 'string',
                            description: 'Conversation ID',
                        },
                        messageType: {
                            type: 'string',
                            enum: ['text', 'auto'],
                            description: 'Message type',
                        },
                        readBy: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Users who read the message',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Conversation: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Conversation ID',
                        },
                        participants: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/User',
                            },
                        },
                        lastMessage: {
                            $ref: '#/components/schemas/Message',
                        },
                        lastMessageAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                        message: {
                            type: 'string',
                            description: 'Detailed error message',
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
