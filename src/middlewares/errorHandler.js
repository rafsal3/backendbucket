const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: message
            }
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_ENTRY',
                message: message,
                details: err.keyValue
            }
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: message.join(', ')
            }
        });
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An unexpected error occurred'
        }
    });
};

module.exports = errorHandler;
