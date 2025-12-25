const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
    spaceId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `space_${Date.now()}`;
        }
    },
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Space name is required'],
        trim: true
    },
    icon: {
        type: String,
        default: '📁'
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
spaceSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('Space', spaceSchema);
