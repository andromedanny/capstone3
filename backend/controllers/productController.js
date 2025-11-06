import Product from '../models/product.js';
import Store from '../models/store.js';
import { Op } from 'sequelize';
import path from 'path';
import { uploadToSupabase, deleteFromSupabase } from '../utils/supabaseStorage.js';

// Get all products for a store
export const getProducts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user's store
    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const products = await Product.findAll({
      where: { storeId: store.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get a single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({
      where: { id, storeId: store.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ 
        message: 'Store not found. Please create a store first before adding products.' 
      });
    }

    const { name, description, price, stock, isActive } = req.body;
    
    // Validate required fields
    if (!name || !description || !price) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, and price are required' 
      });
    }

    let imagePath = null;

    // Handle file upload to Supabase Storage
    if (req.file) {
      try {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `product_${Date.now()}${fileExtension}`;
        
        // Upload to Supabase Storage
        const { path: storagePath } = await uploadToSupabase(
          req.file.buffer,
          'products',
          fileName,
          req.file.mimetype
        );
        
        // Store the storage path (e.g., "products/product_123.jpg")
        imagePath = storagePath;
      } catch (fileError) {
        console.error('Error uploading file to Supabase:', fileError);
        return res.status(500).json({ 
          message: 'Error uploading product image', 
          error: fileError.message 
        });
      }
    }

    const product = await Product.create({
      storeId: store.id,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      image: imagePath,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      message: 'Error creating product', 
      error: error.message,
      details: error.parent?.message || error.stack
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({
      where: { id, storeId: store.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, stock, isActive } = req.body;
    let imagePath = product.image;

    // Handle file upload if new image provided
    if (req.file) {
      try {
        // Delete old image from Supabase Storage if exists
        if (product.image && (product.image.startsWith('products/') || product.image.startsWith('backgrounds/'))) {
          try {
            await deleteFromSupabase('products', product.image);
          } catch (deleteError) {
            console.warn('Error deleting old image from Supabase:', deleteError);
            // Continue even if deletion fails
          }
        }

        // Upload new image to Supabase Storage
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `product_${Date.now()}${fileExtension}`;
        
        const { path: storagePath } = await uploadToSupabase(
          req.file.buffer,
          'products',
          fileName,
          req.file.mimetype
        );
        
        imagePath = storagePath;
      } catch (fileError) {
        console.error('Error uploading file to Supabase:', fileError);
        return res.status(500).json({ 
          message: 'Error uploading product image', 
          error: fileError.message 
        });
      }
    }

    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      image: imagePath,
      isActive: isActive !== undefined ? isActive : product.isActive
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({
      where: { id, storeId: store.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image from Supabase Storage if exists
    if (product.image && (product.image.startsWith('products/') || product.image.startsWith('backgrounds/'))) {
      try {
        const bucket = product.image.startsWith('products/') ? 'products' : 'backgrounds';
        await deleteFromSupabase(bucket, product.image);
      } catch (deleteError) {
        console.warn('Error deleting image from Supabase:', deleteError);
        // Continue with product deletion even if image deletion fails
      }
    }

    await product.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Get public products for a store (for published stores)
export const getPublicProducts = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findOne({
      where: { id: storeId, status: 'published' }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    const products = await Product.findAll({
      where: {
        storeId: store.id,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

