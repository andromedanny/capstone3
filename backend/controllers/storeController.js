import Store from '../models/store.js';
import User from '../models/user.js';

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
    res.status(400).json({ 
      message: error.message,
      details: error.parent?.message || 'Unknown error occurred'
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
    res.status(200).json(stores);
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
    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    await store.update({
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
    res.status(200).json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

    res.json(store);
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({
      message: 'Error fetching store',
      error: error.message
    });
  }
}; 