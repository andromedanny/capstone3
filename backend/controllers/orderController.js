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

    // Validate store exists and is published
    const store = await Store.findOne({
      where: { id: storeId, status: 'published' }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, storeId, isActive: true }
      });

      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemSubtotal = parseFloat(product.price) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal,
        product
      });
    }

    const shippingCost = parseFloat(shipping) || 0;
    const total = subtotal + shippingCost;

    // Create order
    const order = await Order.create({
      storeId,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      subtotal,
      shipping: shippingCost,
      total,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone
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

      // Update product stock
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    // Fetch complete order with items
    const completeOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
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

