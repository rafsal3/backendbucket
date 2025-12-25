const express = require('express');
const {
    syncData,
    getBackup,
    restoreBackup
} = require('../controllers/syncController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', syncData);
router.get('/backup', getBackup);
router.post('/backup/restore', restoreBackup);

module.exports = router;
