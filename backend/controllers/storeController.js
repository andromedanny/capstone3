import Store from '../models/store.js';
import User from '../models/user.js';

export const createStore = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);

    const {
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
    } = req.body;

    // Get user from the authenticated request
    const user = await User.findByPk(req.user.id);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if domain name is already taken
    const existingStore = await Store.findOne({ where: { domainName } });
    if (existingStore) {
      return res.status(400).json({ message: 'Domain name is already taken' });
    }

    // Create the store
    const storeData = {
      userId: user.id,
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
    };
    console.log('Attempting to create store with data:', storeData);

    const store = await Store.create(storeData);
    console.log('Store created successfully:', store.id);

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Store creation error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: 'Error creating store',
      error: error.message
    });
  }
};

export const getUserStores = async (req, res) => {
  try {
    console.log('Fetching stores for user:', req.user);
    
    const stores = await Store.findAll({
      where: { userId: req.user.id },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    console.log('Found stores:', stores);
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({
      message: 'Error fetching stores',
      error: error.message
    });
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