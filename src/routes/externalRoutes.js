const express = require('express');
const {
    searchMovies,
    searchBooks
} = require('../controllers/externalController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/movies/search', searchMovies);
router.get('/books/search', searchBooks);

module.exports = router;
