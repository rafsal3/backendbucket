const express = require('express');
const { getStats } = require('../controllers/statsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getStats);

module.exports = router;
