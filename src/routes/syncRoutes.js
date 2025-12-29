const express = require('express');
const {
    pushChanges,
    pullChanges,
    createBackup,
    restoreBackup
} = require('../controllers/syncController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Sync endpoints (offline-first architecture)
router.post('/push', pushChanges);
router.get('/pull', pullChanges);

// Backup endpoints
router.post('/backup', createBackup);
router.post('/restore', restoreBackup);

module.exports = router;
