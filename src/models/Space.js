const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    // Legacy field for backward compatibility
    spaceId: {
        type: String,
        default: function () {
            return this.id;
        }
    },
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
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
spaceSchema.index({ userId: 1, updatedAt: 1 });
spaceSchema.index({ userId: 1, deviceId: 1 });
spaceSchema.index({ userId: 1, order: 1 });
spaceSchema.index({ userId: 1, deleted: 1 });

module.exports = mongoose.model('Space', spaceSchema);
