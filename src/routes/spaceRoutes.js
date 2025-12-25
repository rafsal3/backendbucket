const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const {
    getAllSpaces,
    getSpace,
    createSpace,
    updateSpace,
    toggleSpaceVisibility,
    reorderSpaces,
    deleteSpace
} = require('../controllers/spaceController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getAllSpaces);
router.get('/:spaceId', getSpace);

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Space name is required'),
        validate
    ],
    createSpace
);

router.put(
    '/:spaceId',
    [
        body('name').notEmpty().withMessage('Space name is required'),
        validate
    ],
    updateSpace
);

router.patch('/:spaceId/visibility', toggleSpaceVisibility);
router.patch('/reorder', reorderSpaces);
router.delete('/:spaceId', deleteSpace);

module.exports = router;
