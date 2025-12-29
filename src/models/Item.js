const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    // Legacy field for backward compatibility
    itemId: {
        type: String,
        default: function () {
            return this.id;
        }
    },
    spaceId: {
        type: String,
        required: true,
        ref: 'Space'
    },
    categoryId: {
        type: String,
        ref: 'Category',
        default: null
    },
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    text: {
        type: String,
        required: [true, 'Item text is required'],
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    imageUrl: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    deleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deviceId: {
        type: String,
        required: false,
        default: 'server'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for sync queries
itemSchema.index({ userId: 1, updatedAt: 1 });
itemSchema.index({ userId: 1, deviceId: 1 });
itemSchema.index({ spaceId: 1, categoryId: 1, order: 1 });
itemSchema.index({ userId: 1, deleted: 1 });
itemSchema.index({ isCompleted: 1 });

module.exports = mongoose.model('Item', itemSchema);
