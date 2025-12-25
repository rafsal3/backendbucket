const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `item_${Date.now()}`;
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
        ref: 'User'
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

// Indexes for faster queries
itemSchema.index({ spaceId: 1, categoryId: 1, order: 1 });
itemSchema.index({ userId: 1 });
itemSchema.index({ isCompleted: 1 });

module.exports = mongoose.model('Item', itemSchema);
