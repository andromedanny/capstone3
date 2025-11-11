import Order from '../models/order.js';
import OrderItem from '../models/orderItem.js';
import Product from '../models/product.js';
import Store from '../models/store.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Get all orders for a store
export const getOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { status } = req.query;
    const whereClause = { storeId: store.id };
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a single order
export const getOrderById = async (req, res) => {
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

    const order = await Order.findOne({
      where: { id, storeId: store.id },
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Create a new order
export const createOrder = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      storeId,
      items,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      shipping
    } = req.body;

    // Validate required fields
    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Store ID and items are required' });
    }

    if (!customerName || !customerEmail || !paymentMethod) {
      return res.status(400).json({ message: 'Customer name, email, and payment method are required' });
    }

    if (!shippingAddress || !shippingAddress.region || !shippingAddress.province || 
        !shippingAddress.municipality || !shippingAddress.barangay) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // Validate store exists and is published
    const store = await Store.findOne({
      where: { id: storeId, status: 'published' },
      attributes: ['id', 'status']
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    // Validate products and calculate totals with timeout
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: 'Each item must have productId and quantity' });
      }

      const product = await Product.findOne({
        where: { id: item.productId, storeId, isActive: true },
        attributes: ['id', 'name', 'price', 'stock']
      });

      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      // Allow orders even if stock is 0 or undefined (for products without stock tracking)
      const availableStock = product.stock !== null && product.stock !== undefined ? product.stock : 999999;
      if (availableStock < item.quantity && availableStock < 999999) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}`
        });
      }

      const itemSubtotal = parseFloat(product.price || 0) * parseInt(item.quantity || 1);
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        quantity: parseInt(item.quantity),
        price: parseFloat(product.price || 0),
        subtotal: itemSubtotal
      });
    }

    const shippingCost = parseFloat(shipping) || 0;
    const total = subtotal + shippingCost;

    // Create order
    const order = await Order.create({
      storeId,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      paymentMethod: paymentMethod || 'gcash',
      paymentStatus: 'pending',
      subtotal,
      shipping: shippingCost,
      total,
      shippingAddress: shippingAddress, // Store as JSON object (Sequelize handles JSON type)
      customerName,
      customerEmail,
      customerPhone: customerPhone || ''
    });

    // Create order items and update product stock
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      });

      // Update product stock (non-blocking - don't fail order if stock update fails)
      try {
        await Product.decrement('stock', {
          by: item.quantity,
          where: { id: item.productId }
        });
      } catch (stockError) {
        console.warn('Stock update failed (non-critical):', stockError.message);
        // Continue - don't fail the order if stock update fails
      }
    }

    // Fetch complete order with items
    const completeOrder = await Order.findOne({
      where: { id: order.id },
      attributes: ['id', 'storeId', 'orderNumber', 'status', 'paymentMethod', 
                   'paymentStatus', 'subtotal', 'shipping', 'total', 
                   'shippingAddress', 'customerName', 'customerEmail', 
                   'customerPhone', 'createdAt', 'updatedAt'],
      include: [
        {
          model: OrderItem,
          attributes: ['id', 'orderId', 'productId', 'quantity', 'price', 'subtotal'],
          include: [{
            model: Product,
            attributes: ['id', 'name', 'price', 'image']
          }]
        }
      ]
    });

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`Slow order creation: took ${duration}ms`);
    }

    res.status(201).json(completeOrder);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error creating order (${duration}ms):`, error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error original:', error.original);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Handle all Sequelize errors as database errors
    if (error.name && error.name.startsWith('Sequelize')) {
      console.error('Sequelize error detected:', error.name);
      return res.status(503).json({ 
        message: 'Database error - please try again',
        error: 'DATABASE_ERROR',
        details: error.message
      });
    }
    
    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Connection') ||
        error.message?.includes('connect') ||
        error.message?.includes('timeout')) {
      console.error('Database connection error detected');
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR',
        details: error.message
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.errors?.map(e => e.message).join(', ') || error.message
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      message: 'Error creating order', 
      error: error.message || 'Unknown error occurred',
      details: error.stack
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });

    // If cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id }
      });

      for (const item of orderItems) {
        await Product.increment('stock', {
          by: item.quantity,
          where: { id: item.productId }
        });
      }
    }

    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentTransactionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({
      paymentStatus,
      paymentTransactionId: paymentTransactionId || order.paymentTransactionId
    });

    // If payment completed, update order status to processing
    if (paymentStatus === 'completed' && order.status === 'pending') {
      await order.update({ status: 'processing' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { startDate, endDate } = req.query;
    const whereClause = {
      storeId: store.id,
      status: 'completed',
      paymentStatus: 'completed'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get monthly sales data
    const orders = await Order.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSales'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Get total sales
    const totalSales = await Order.sum('total', {
      where: whereClause
    }) || 0;

    // Get total orders
    const totalOrders = await Order.count({
      where: whereClause
    });

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: whereClause,
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    res.json({
      monthlySales: orders,
      totalSales,
      totalOrders,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'Error fetching sales analytics', error: error.message });
  }
};

