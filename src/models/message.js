const mongoose = require('mongoose');
const { elasticClient } = require('../config/elasticsearch');

const messageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Message sender is required'],
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation is required'],
        },
        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Static method to get unread count for a conversation
messageSchema.statics.getUnreadCount = async function (userId, conversationId) {
    const messages = await this.find({
        conversation: conversationId,
        readBy: { $ne: userId }, // $ne: not equal to
    });
    return messages.length;
};

messageSchema.methods.markAsRead = async function (userId) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
};

messageSchema.post('save', async function (doc) {
    await elasticClient.index({
        index: 'messages',
        document: {
            messageId: doc._id,
            sender: doc.sender,
            receiver: doc.receiver,
            content: doc.content,
            createdAt: doc.createdAt,
        },
    });
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
