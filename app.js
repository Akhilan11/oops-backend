const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const mongoose = require('mongoose');

const corsOptions = require('./config/cors');
const { errorHandler, apiLimiter } = require('./src/middleware');

// Route imports — each module exports via index.js barrel
const authRoutes = require('./src/auth');
const productRoutes = require('./src/product');
const orderRoutes = require('./src/order');
const addressRoutes = require('./src/address');
const customerRoutes = require('./src/customer');
const dashboardRoutes = require('./src/dashboard');
const settingsRoutes = require('./src/settings');
const uploadRoutes = require('./src/upload');
const reviewRoutes = require('./src/review');

const app = express();

// Security
app.use(helmet());
app.use(cors(corsOptions));
app.use(mongoSanitize());

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files
app.use('/images', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'public/images')));

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes
app.use('/api/auth', authRoutes.consumer);
app.use('/api/admin/auth', authRoutes.admin);
app.use('/api/products', productRoutes.public);
app.use('/api/products/:productId/reviews', reviewRoutes.productRouter);
app.use('/api/reviews', reviewRoutes.reviewRouter);
app.use('/api/admin/reviews', reviewRoutes.adminRouter);
app.use('/api/admin/products', productRoutes.admin);
app.use('/api/orders', orderRoutes.consumer);
app.use('/api/admin/orders', orderRoutes.admin);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
