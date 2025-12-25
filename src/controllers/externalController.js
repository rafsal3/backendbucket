const axios = require('axios');

// @desc    Search movies using TMDB API
// @route   GET /api/v1/external/movies/search
// @access  Private
const searchMovies = async (req, res, next) => {
    try {
        const { query, page = 1 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Search query is required'
                }
            });
        }

        const response = await axios.get(`${process.env.TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                query,
                page
            }
        });

        const results = response.data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.poster_path,
            releaseDate: movie.release_date,
            voteAverage: movie.vote_average,
            fullPosterUrl: movie.poster_path
                ? `${process.env.TMDB_IMAGE_BASE_URL}${movie.poster_path}`
                : null
        }));

        res.status(200).json({
            success: true,
            data: {
                results,
                page: response.data.page,
                totalPages: response.data.total_pages,
                totalResults: response.data.total_results
            }
        });
    } catch (error) {
        console.error('TMDB API Error:', error.message);
        next(error);
    }
};

// @desc    Search books using OpenLibrary API
// @route   GET /api/v1/external/books/search
// @access  Private
const searchBooks = async (req, res, next) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Search query is required'
                }
            });
        }

        const response = await axios.get(`${process.env.OPENLIBRARY_BASE_URL}/search.json`, {
            params: {
                q: query,
                limit
            }
        });

        const results = response.data.docs.map(book => ({
            key: book.key,
            title: book.title,
            author: book.author_name ? book.author_name[0] : 'Unknown',
            firstPublishYear: book.first_publish_year,
            coverUrl: book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                : null
        }));

        res.status(200).json({
            success: true,
            data: {
                results,
                total: response.data.numFound
            }
        });
    } catch (error) {
        console.error('OpenLibrary API Error:', error.message);
        next(error);
    }
};

module.exports = {
    searchMovies,
    searchBooks
};
