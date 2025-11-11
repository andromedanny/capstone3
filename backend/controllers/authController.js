import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import sequelize from '../config/db.js';

export const register = async (req, res) => {
  const startTime = Date.now();
  const { firstName, lastName, email, password } = req.body;
  
  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists with shorter timeout
    const existingUser = await Promise.race([
      User.findOne({ 
        where: { email },
        attributes: ['id', 'email']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password with timeout
    const hashedPassword = await Promise.race([
      bcrypt.hash(password, 10),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password hashing timeout')), 5000)
      )
    ]);

    // Create user with shorter timeout
    const user = await Promise.race([
      User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User creation timeout')), 8000)
      )
    ]);

    // Remove password from response
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`Slow registration: took ${duration}ms`);
    }

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: userWithoutPassword 
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Registration error (${duration}ms):`, err.message);
    console.error('Error stack:', err.stack);
    
    // Handle timeout specifically
    if (err.message.includes('timeout') || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - please try again',
        error: 'TIMEOUT'
      });
    }
    
    // Handle database errors
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeDatabaseError') {
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR'
      });
    }
    
    // Handle unique constraint (duplicate email)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'User already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }
    
    res.status(500).json({ 
      message: 'Registration failed', 
      error: err.message || 'Unknown error occurred'
    });
  }
};

export const login = async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;
  
  try {
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user with aggressive timeout - fail fast if database is slow
    const user = await Promise.race([
      User.findOne({ 
        where: { email },
        attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'role'],
        raw: false // Keep as Sequelize instance for password access
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 6000)
      )
    ]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password with timeout
    const isMatch = await Promise.race([
      bcrypt.compare(password, user.password),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password comparison timeout')), 5000)
      )
    ]);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: '1d',
      }
    );

    // Remove password from user object before sending
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`Slow login: took ${duration}ms`);
    }

    res.json({ 
      message: 'Logged in successfully', 
      token, 
      user: userWithoutPassword 
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Login error (${duration}ms):`, err.message);
    console.error('Error stack:', err.stack);
    
    // Handle timeout specifically
    if (err.message.includes('timeout') || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - please try again',
        error: 'TIMEOUT'
      });
    }
    
    // Handle database errors
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeDatabaseError') {
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR'
      });
    }
    
    res.status(500).json({ 
      message: 'Login failed', 
      error: err.message || 'Unknown error occurred'
    });
  }
};
