const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `pref_${this.userId}`;
        }
    },
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User',
        index: true
    },
    isDarkMode: {
        type: Boolean,
        default: true
    },
    themeColor: {
        type: String,
        default: 'blue'
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
userPreferencesSchema.index({ userId: 1, updatedAt: 1 });

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
