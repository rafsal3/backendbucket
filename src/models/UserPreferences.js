const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },
    isDarkMode: {
        type: Boolean,
        default: true
    },
    themeColor: {
        type: String,
        default: 'blue'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
