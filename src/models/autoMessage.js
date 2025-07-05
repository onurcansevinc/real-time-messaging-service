const mongoose = require('mongoose');

const autoMessageSchema = new mongoose.Schema(
    {
        // Mesaj içeriği
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },

        // Sender
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required'],
        },

        // Receiver
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Receiver is required'],
        },

        // Conversation
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation is required'],
        },

        // Send date
        sendDate: {
            type: Date,
            required: [true, 'Send date is required'],
            index: true, // For performance
        },

        // Status
        isQueued: {
            type: Boolean,
            default: false,
            index: true, // Whether it is sent to RabbitMQ
        },

        isSent: {
            type: Boolean,
            default: false,
            index: true, // Whether it is sent to RabbitMQ
        },

        // Timestamps
        queuedAt: {
            type: Date,
            default: null,
        },

        sentAt: {
            type: Date,
            default: null,
        },

        // Error message
        errorMessage: {
            type: String,
            default: null,
        },

        // Retry count
        retryCount: {
            type: Number,
            default: 0,
            max: [5, 'Max retry count is 5'],
        },
    },
    {
        timestamps: true, // createdAt and updatedAt are automatically added
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for performance
autoMessageSchema.index({ sendDate: 1, isQueued: 1 }); // For cron job
autoMessageSchema.index({ isSent: 1, isQueued: 1 }); // For queue management
autoMessageSchema.index({ senderId: 1, receiverId: 1 }); // For user queries

const AutoMessage = mongoose.model('AutoMessage', autoMessageSchema);

module.exports = AutoMessage;
