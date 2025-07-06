const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

const Message = require('../models/message');
const Conversation = require('../models/conversation');
const { authenticateToken } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * tags:
 *   - name: Messages
 *     description: Messaging endpoints
 */

// Validation middleware
const validateMessage = [
    body('content')
        .notEmpty()
        .withMessage('Message content is required')
        .isLength({ max: 1000 })
        .withMessage('Message cannot exceed 1000 characters'),
    body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
];

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, conversationId]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *               conversationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// Send a new message
router.post('/send', authenticateToken, validateMessage, async (req, res) => {
    try {
        // Check if req.body exists
        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Request body is missing',
            });
        }

        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array(),
            });
        }

        const { conversationId, content } = req.body;

        // Check if required fields exist
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field',
                message: 'conversationId is required',
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field',
                message: 'content is required',
            });
        }

        // Create message
        const message = new Message({
            conversation: conversationId,
            content,
            sender: req.user._id,
        });

        await message.save();
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
        });

        return res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                id: message._id,
                content: message.content,
                sender: {
                    id: message.sender._id,
                    username: message.sender.username,
                    avatar: message.sender.avatar,
                },
                messageType: message.messageType,
                createdAt: message.createdAt,
            },
        });
    } catch (error) {
        logger.error('Send message error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/messages/{conversationId}:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       403:
 *         description: Not a participant of this conversation
 *       404:
 *         description: Conversation not found
 */
router.get('/:conversationId', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

        const isParticipant = conversation.participants.some((p) => p._id.toString() === req.user._id.toString());
        if (!isParticipant)
            return res.status(403).json({ success: false, error: 'You are not a participant of this conversation' });

        const messages = await Message.find({ conversation: conversationId }).populate('sender', 'username avatar');
        return res.json({ success: true, data: messages });
    } catch (error) {
        logger.error('Get messages error:', error);
        return errorHandler(error, req, res);
    }
});

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   put:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 *       403:
 *         description: Not authorized
 */
router.put('/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, error: 'Message not found' });

        const conversation = await Conversation.findById(message.conversation);
        if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

        const isParticipant = conversation.participants.some((p) => p._id.toString() === req.user._id.toString());
        if (!isParticipant)
            return res.status(403).json({ success: false, error: 'You are not a participant of this conversation' });

        await message.markAsRead(req.user._id);

        return res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        logger.error('Mark message as read error:', error);
        return errorHandler(error, req, res);
    }
});

module.exports = router;
