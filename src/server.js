require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const externalRoutes = require('./routes/externalRoutes');
const syncRoutes = require('./routes/syncRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later'
        }
    }
});

app.use('/api/', limiter);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Import deprecation middleware
const { deprecationWarning } = require('./middlewares/deprecation');

// API Routes
app.use('/api/v1/auth', authRoutes); // Auth routes are NOT deprecated
app.use('/api/v1/external', externalRoutes); // External API routes are NOT deprecated

// NEW: Sync routes (offline-first architecture) - RECOMMENDED
app.use('/api/v1/sync', syncRoutes);

// DEPRECATED: Old CRUD routes (still functional but discouraged)
app.use('/api/v1/spaces', deprecationWarning('/api/v1/spaces/*', '/api/v1/sync/push and /api/v1/sync/pull'), spaceRoutes);
app.use('/api/v1/spaces/:spaceId/categories', deprecationWarning('/api/v1/spaces/:spaceId/categories/*', '/api/v1/sync/push and /api/v1/sync/pull'), categoryRoutes);
app.use('/api/v1/spaces/:spaceId/items', deprecationWarning('/api/v1/spaces/:spaceId/items/*', '/api/v1/sync/push and /api/v1/sync/pull'), itemRoutes);
app.use('/api/v1/stats', deprecationWarning('/api/v1/stats', '/api/v1/sync/pull'), statsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all network interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://<your-ip-address>:${PORT}`);
    console.log(`To find your IP: Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)`);
    console.log('\n🚀 OFFLINE-FIRST SYNC API ENABLED');
    console.log('   Use /api/v1/sync/push and /api/v1/sync/pull for best performance');
    console.log('   See SYNC_API_DOCUMENTATION.md for details\n');
});

module.exports = app;
