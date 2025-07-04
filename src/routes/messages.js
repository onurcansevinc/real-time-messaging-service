const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const Message = require('../models/message');
const Conversation = require('../models/conversation');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const validateMessage = [
    body('content')
        .notEmpty()
        .withMessage('Message content is required')
        .isLength({ max: 1000 })
        .withMessage('Message cannot exceed 1000 characters'),
    body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
];

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

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
        });

        await message.save();

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
        console.error('Send message error:', error);

        // Handle different types of errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach((field) => {
                validationErrors[field] = error.errors[field].message;
            });

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Please check your input data',
                details: validationErrors,
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format',
                message: 'The provided conversation ID is not valid',
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Duplicate message',
                message: 'This message already exists',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'An unexpected error occurred while sending the message',
        });
    }
});

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
        console.error('Get messages error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

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

        message.readBy.push(req.user._id);
        await message.save();

        return res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark message as read error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
