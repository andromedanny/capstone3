import Store from '../models/store.js';
import User from '../models/user.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import { uploadToSupabase } from '../utils/supabaseStorage.js';

// Configure multer for background image uploads (memory storage for Supabase)
const storage = multer.memoryStorage();

export const uploadBackground = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create a new store for a user
export const createStore = async (req, res) => {
  try {
    const { templateId, storeName, description, domainName, region, province, municipality, barangay, contactEmail, phone } = req.body;
    
    // Get userId from the authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      console.error('No user ID found in request:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Creating store for user:', userId);
    
    const store = await Store.create({
      userId,
      templateId,
      storeName,
      description,
      domainName,
      region,
      province,
      municipality,
      barangay,
      contactEmail,
      phone
    });
    
    console.log('Store created successfully:', store.id);
    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    
    // Check for duplicate domain name
    if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === 'ER_DUP_ENTRY') {
      if (error.errors?.some(e => e.path === 'domainName') || error.parent?.message?.includes('domainName')) {
        return res.status(400).json({ 
          message: 'A store with this domain name already exists. Please choose a different domain name.',
          details: error.parent?.message || 'Duplicate domain name'
        });
      }
      if (error.errors?.some(e => e.path === 'storeName') || error.parent?.message?.includes('storeName')) {
        return res.status(400).json({ 
          message: 'You already have a store with this name. Please choose a different name or update your existing store.',
          details: error.parent?.message || 'Duplicate store name'
        });
      }
    }
    
    res.status(400).json({ 
      message: error.message || 'Validation error',
      details: error.parent?.message || error.message || 'Unknown error occurred'
    });
  }
};

// Get all stores for a specific user
export const getUserStores = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Fetching stores for user:', userId);
    
    const stores = await Store.findAll({ 
      where: { userId },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });
    
    console.log('Found stores:', stores.length);
    
    // Parse content for each store if it's a string
    const storesData = stores.map(store => {
      const storeData = store.toJSON();
      if (storeData.content && typeof storeData.content === 'string') {
        try {
          storeData.content = JSON.parse(storeData.content);
        } catch (e) {
          console.error('Error parsing store content:', e);
        }
      }
      return storeData;
    });
    
    res.status(200).json(storesData);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.parent?.message || 'Unknown error occurred'
    });
  }
};

// Update a store
export const updateStore = async (req, res) => {
  const { id } = req.params;
  const { templateId, storeName, description, domainName, region, province, municipality, barangay, contactEmail, phone } = req.body;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    // Check if domain name is being changed and if it conflicts with another store
    if (domainName && domainName !== store.domainName) {
      const existingStore = await Store.findOne({ 
        where: { 
          domainName, 
          id: { [Op.ne]: id } // Exclude current store
        } 
      });
      if (existingStore) {
        return res.status(400).json({ 
          message: 'A store with this domain name already exists. Please choose a different domain name.',
          details: 'Duplicate domain name'
        });
      }
    }

    await store.update({
      templateId: templateId || store.templateId,
      storeName: storeName || store.storeName,
      description: description || store.description,
      domainName: domainName || store.domainName,
      region: region || store.region,
      province: province || store.province,
      municipality: municipality || store.municipality,
      barangay: barangay || store.barangay,
      contactEmail: contactEmail || store.contactEmail,
      phone: phone || store.phone
    });
    res.status(200).json(store);
  } catch (error) {
    console.error('Error updating store:', error);
    
    // Check for duplicate domain name
    if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === 'ER_DUP_ENTRY') {
      if (error.errors?.some(e => e.path === 'domainName') || error.parent?.message?.includes('domainName')) {
        return res.status(400).json({ 
          message: 'A store with this domain name already exists. Please choose a different domain name.',
          details: error.parent?.message || 'Duplicate domain name'
        });
      }
    }
    
    res.status(400).json({ 
      message: error.message || 'Validation error',
      details: error.parent?.message || error.message || 'Unknown error occurred'
    });
  }
};

// Delete a store
export const deleteStore = async (req, res) => {
  const { id } = req.params;
  try {
    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    await store.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { id: req.params.id },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this store' });
    }

    // Parse content if it's a string
    const storeData = store.toJSON();
    if (storeData.content && typeof storeData.content === 'string') {
      try {
        storeData.content = JSON.parse(storeData.content);
      } catch (e) {
        console.error('Error parsing store content:', e);
      }
    }
    
    res.json(storeData);
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({
      message: 'Error fetching store',
      error: error.message
    });
  }
};

// Upload background image to Supabase Storage
export const uploadBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Supabase Storage
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `bg-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    const { path: storagePath, url: publicUrl } = await uploadToSupabase(
      req.file.buffer,
      'backgrounds',
      fileName,
      req.file.mimetype
    );

    // Return the storage path (frontend will construct full URL using getImageUrl)
    res.status(200).json({ 
      message: 'Background image uploaded successfully',
      imageUrl: storagePath, // Return path like "backgrounds/bg-123.jpg"
      publicUrl: publicUrl // Also return full URL for convenience
    });
  } catch (error) {
    console.error('Error uploading background image to Supabase:', error);
    res.status(500).json({
      message: 'Error uploading background image',
      error: error.message
    });
  }
};

// Save store content (hero, products, etc.)
export const saveStoreContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Log request size for debugging
    const contentSize = JSON.stringify(content).length;
    console.log(`📦 Saving store content for store ${id}`);
    console.log(`   Content size: ${(contentSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Content keys:`, content ? Object.keys(content) : 'null');
    console.log(`   Background settings:`, content?.background);

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    // Ensure content is a proper object
    const contentToSave = typeof content === 'string' ? JSON.parse(content) : content;
    
    await store.update({ content: contentToSave });
    
    // Reload the store to verify the content was saved
    const updatedStore = await Store.findByPk(id);
    console.log(`✅ Content saved. Verifying...`);
    
    // Parse content if it's a string (Sequelize might return it as string)
    let parsedContent = updatedStore.content;
    if (typeof parsedContent === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent);
      } catch (e) {
        console.error('Error parsing content:', e);
      }
    }
    
    console.log(`   Saved content type:`, typeof parsedContent);
    console.log(`   Saved content keys:`, parsedContent ? Object.keys(parsedContent) : 'null');
    console.log(`   Saved background:`, parsedContent?.background);
    
    // Return store with parsed content
    const storeResponse = updatedStore.toJSON();
    storeResponse.content = parsedContent;
    
    res.status(200).json({ message: 'Content saved successfully', store: storeResponse });
  } catch (error) {
    console.error('Error saving store content:', error);
    res.status(500).json({
      message: 'Error saving store content',
      error: error.message
    });
  }
};

// Publish or unpublish a store
export const publishStore = async (req, res) => {
  try {
    console.log('📢 publishStore function called!');
    console.log('   Request params:', req.params);
    console.log('   Request body:', req.body);
    console.log('   User:', req.user?.id);
    
    const { id } = req.params;
    const { status } = req.body; // 'published' or 'draft'

    if (status !== 'published' && status !== 'draft') {
      return res.status(400).json({ message: 'Status must be "published" or "draft"' });
    }

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    await store.update({ status });
    res.status(200).json({ 
      message: `Store ${status === 'published' ? 'published' : 'unpublished'} successfully`,
      store 
    });
  } catch (error) {
    console.error('Error publishing store:', error);
    res.status(500).json({
      message: 'Error publishing store',
      error: error.message
    });
  }
};

// Get published store by domain (public route - no auth required)
export const getPublishedStoreByDomain = async (req, res) => {
  try {
    const { domain } = req.params;

    const store = await Store.findOne({
      where: { 
        domainName: domain,
        status: 'published'
      },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    // Parse content if it's a string (Sequelize might return it as string)
    const storeData = store.toJSON();
    if (storeData.content && typeof storeData.content === 'string') {
      try {
        storeData.content = JSON.parse(storeData.content);
      } catch (e) {
        console.error('Error parsing store content:', e);
      }
    }
    
    console.log('📦 Published store content:', storeData.content);
    console.log('📦 Published store background:', storeData.content?.background);

    res.json(storeData);
  } catch (error) {
    console.error('Error fetching published store:', error);
    res.status(500).json({
      message: 'Error fetching published store',
      error: error.message
    });
  }
}; 