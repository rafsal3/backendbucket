const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    toggleCategoryVisibility,
    reorderCategories,
    deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

// All routes are protected
router.use(protect);

router.get('/', getAllCategories);
router.get('/:categoryId', getCategory);

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Category name is required'),
        validate
    ],
    createCategory
);

router.put(
    '/:categoryId',
    [
        body('name').notEmpty().withMessage('Category name is required'),
        validate
    ],
    updateCategory
);

router.patch('/:categoryId/visibility', toggleCategoryVisibility);
router.patch('/reorder', reorderCategories);
router.delete('/:categoryId', deleteCategory);

module.exports = router;
