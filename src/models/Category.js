const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `category_${Date.now()}`;
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
        ref: 'User'
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

// Index for faster queries
categorySchema.index({ spaceId: 1, order: 1 });
categorySchema.index({ userId: 1 });

module.exports = mongoose.model('Category', categorySchema);
