const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const {
    getAllItems,
    getItem,
    createItem,
    updateItem,
    toggleItemCompletion,
    moveItem,
    reorderItems,
    deleteItem
} = require('../controllers/itemController');
const { protect } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

// All routes are protected
router.use(protect);

router.get('/', getAllItems);
router.get('/:itemId', getItem);

router.post(
    '/',
    [
        body('text').notEmpty().withMessage('Item text is required'),
        validate
    ],
    createItem
);

router.put('/:itemId', updateItem);
router.patch('/:itemId/toggle', toggleItemCompletion);
router.patch('/:itemId/move', moveItem);
router.delete('/:itemId', deleteItem);

// Reorder items within a category
router.patch('/categories/:categoryId/items/reorder', reorderItems);

module.exports = router;
