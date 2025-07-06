const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

const User = require('../models/user');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

const { cacheMiddleware } = require('../middleware/cache');
const { authenticateToken } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * tags:
 *   - name: Conversations
 *     description: Conversation management
 */

// Validation middleware
const validateConversation = [body('participantId').isMongoId().withMessage('Invalid participant ID')];

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: List all conversations for the user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page size
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, cacheMiddleware('conversation-list'), async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        // Get user conversations
        const conversations = await Conversation.getUserConversations(userId, parseInt(page), parseInt(limit));

        // Get unread counts
        const conversationsWithUnreadCount = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.getUnreadCount(userId, conv._id);
                return { ...conv, unreadCount };
            })
        );

        return res.json({
            success: true,
            message: 'Conversations retrieved successfully',
            data: {
                conversations: conversationsWithUnreadCount.map((conv) => ({
                    id: conv._id,
                    participants: conv.participants.map((p) => ({
                        id: p._id,
                        username: p.username,
                        avatar: p.avatar,
                        isOnline: p.isOnline,
                        lastSeen: p.lastSeen,
                    })),
                    lastMessage: conv.lastMessage
                        ? {
                              id: conv.lastMessage._id,
                              content: conv.lastMessage.content,
                              sender: {
                                  id: conv.lastMessage.sender._id,
                                  username: conv.lastMessage.sender.username,
                              },
                              createdAt: conv.lastMessage.createdAt,
                          }
                        : null,
                    lastMessageAt: conv.lastMessageAt,
                    unreadCount: conv.unreadCount,
                    createdAt: conv.createdAt,
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: conversations.length,
                    pages: Math.ceil(conversations.length / limit),
                },
            },
        });
    } catch (error) {
        logger.error('Get conversations error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create or get a direct conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: The user ID to start a conversation with
 *     responses:
 *       200:
 *         description: Conversation retrieved/created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Participant not found
 */
router.post('/', authenticateToken, validateConversation, async (req, res) => {
    try {
        // Check if req.body exists
        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Request body is missing',
            });
        }

        const { participantId } = req.body;
        const userId = req.user._id;

        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array(),
            });
        }

        // Cannot create a conversation with yourself
        if (participantId === userId.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid participant',
                message: 'You cannot create a conversation with yourself',
            });
        }

        // Check if participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            return res.status(404).json({
                success: false,
                error: 'Participant not found',
                message: 'The specified user does not exist',
            });
        }

        // Find or create direct conversation
        const conversation = await Conversation.findOrCreateDirect(userId, participantId);

        return res.json({
            success: true,
            message: 'Conversation retrieved/created successfully',
            data: {
                id: conversation._id,
                participants: conversation.participants.map((p) => ({
                    id: p._id,
                    username: p.username,
                    avatar: p.avatar,
                    isOnline: p.isOnline,
                    lastSeen: p.lastSeen,
                })),
                createdAt: conversation.createdAt,
            },
        });
    } catch (error) {
        logger.error('Create conversation error:', error);
        return errorHandler(error, req, res);
    }
});

module.exports = router;
