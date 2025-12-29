const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    // Legacy field for backward compatibility
    categoryId: {
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
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true
    },
    icon: {
        type: String,
        default: '📌'
    },
    isHidden: {
        type: Boolean,
        default: false
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
categorySchema.index({ userId: 1, updatedAt: 1 });
categorySchema.index({ userId: 1, deviceId: 1 });
categorySchema.index({ spaceId: 1, order: 1 });
categorySchema.index({ userId: 1, deleted: 1 });

module.exports = mongoose.model('Category', categorySchema);
