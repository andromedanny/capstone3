import express from 'express';
import { createStore, getUserStores, getStoreById } from '../controllers/storeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new store
router.post('/', createStore);

// Get all stores for the authenticated user
router.get('/', getUserStores);

// Get a specific store by ID
router.get('/:id', getStoreById);

export default router; 