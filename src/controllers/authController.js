const User = require('../models/User');
const UserPreferences = require('../models/UserPreferences');
const { generateToken } = require('../utils/jwt');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'User already exists with this email'
                }
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name
        });

        // Create default preferences
        await UserPreferences.create({
            userId: user.userId
        });

        // Generate token
        const token = generateToken(user.userId);

        res.status(201).json({
            success: true,
            data: {
                userId: user.userId,
                email: user.email,
                name: user.name,
                token,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = generateToken(user.userId);

        res.status(200).json({
            success: true,
            data: {
                userId: user.userId,
                email: user.email,
                name: user.name,
                token,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        const preferences = await UserPreferences.findOne({ userId: req.user.userId });

        res.status(200).json({
            success: true,
            data: {
                userId: user.userId,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                preferences: {
                    isDarkMode: preferences?.isDarkMode || true,
                    themeColor: preferences?.themeColor || 'blue'
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user preferences
// @route   PATCH /api/v1/auth/preferences
// @access  Private
const updatePreferences = async (req, res, next) => {
    try {
        const { isDarkMode, themeColor } = req.body;

        const preferences = await UserPreferences.findOneAndUpdate(
            { userId: req.user.userId },
            { isDarkMode, themeColor, updatedAt: Date.now() },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: {
                isDarkMode: preferences.isDarkMode,
                themeColor: preferences.themeColor
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updatePreferences
};
