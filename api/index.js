// Vercel serverless function entry point
// This file handles all API routes for Vercel deployment

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

// Import routes (lazy import might help with cold starts)
import authRoutes from '../backend/routes/authRoutes.js';
import storeRoutes from '../backend/routes/storeRoutes.js';
import productRoutes from '../backend/routes/productRoutes.js';
import orderRoutes from '../backend/routes/orderRoutes.js';
import paymentRoutes from '../backend/routes/paymentRoutes.js';
import { servePublishedStoreHTML } from '../backend/controllers/publicStoreController.js';

// Import models to ensure they are registered
import User from '../backend/models/user.js';
import Store from '../backend/models/store.js';
import Product from '../backend/models/product.js';
import Order from '../backend/models/order.js';
import OrderItem from '../backend/models/orderItem.js';

// Set up model associations
Store.hasMany(Product, {
  foreignKey: 'storeId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

const app = express();

// CORS configuration - Allow all Vercel domains
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains (production and preview deployments)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.log('CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parser with increased limits for file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from Supabase Storage (via public URLs)
// Note: In production, files are served from Supabase Storage, not local filesystem

// Standalone store pages
app.get('/store/:domain', servePublishedStoreHTML);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error Stack:', err.stack);
  console.error('Request Path:', req.path);
  console.error('Request Method:', req.method);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    // Show stack trace and details for debugging (remove in production later)
    stack: err.stack,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { 
      fullError: err.toString()
    })
  });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Lazy import to avoid loading at module level
    const dbModule = await import('../backend/config/db.js');
    const sequelize = dbModule.default;
    await sequelize.authenticate();
    res.json({ 
      status: 'success', 
      message: 'Database connection successful',
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message,
      stack: error.stack,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
        nodeEnv: process.env.NODE_ENV,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
        supabaseUrlLength: process.env.SUPABASE_DB_URL?.length || 0
      }
    });
  }
});

// Export for Vercel serverless
export default function handler(req, res) {
  return app(req, res);
}

