const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const {
    register,
    login,
    getProfile,
    updatePreferences
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().withMessage('Name is required'),
        validate
    ],
    register
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    login
);

// Protected routes
router.get('/profile', protect, getProfile);
router.patch('/preferences', protect, updatePreferences);

module.exports = router;
