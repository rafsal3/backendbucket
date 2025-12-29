/**
 * Deprecated Routes Middleware
 * 
 * This middleware adds deprecation warnings to old CRUD endpoints.
 * These endpoints still work but clients should migrate to the new sync API.
 */

const deprecationWarning = (endpoint, replacement) => {
    return (req, res, next) => {
        // Add deprecation header
        res.setHeader('X-API-Deprecated', 'true');
        res.setHeader('X-API-Deprecation-Info', `This endpoint is deprecated. Use ${replacement} instead.`);
        res.setHeader('X-API-Sunset-Date', '2026-03-01'); // 3 months from now

        // Log deprecation usage
        console.warn(`⚠️  DEPRECATED API CALL: ${req.method} ${endpoint} - Client should migrate to ${replacement}`);

        // Continue to actual handler
        next();
    };
};

module.exports = {
    deprecationWarning
};
