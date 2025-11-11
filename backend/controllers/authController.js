import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
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

    // Find user with timeout
    const user = await Promise.race([
      User.findOne({ 
        where: { email },
        attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'role']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
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
