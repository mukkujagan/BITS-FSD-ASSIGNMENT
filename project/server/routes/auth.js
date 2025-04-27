import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Coordinator } from '../models/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register a new coordinator
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, school } = req.body;

    // Validate input
    if (!name || !email || !password || !school) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if coordinator with the same email already exists
    const existingCoordinator = await Coordinator.findOne({ email });
    if (existingCoordinator) {
      return res.status(400).json({ message: 'Coordinator with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new coordinator
    const newCoordinator = new Coordinator({
      name,
      email,
      password: hashedPassword,
      school
    });

    await newCoordinator.save();

    // Generate JWT token
    const token = jwt.sign({ id: newCoordinator._id }, JWT_SECRET, {
      expiresIn: '1d'
    });

    // Return coordinator data without password
    const coordinatorWithoutPassword = {
      _id: newCoordinator._id,
      name: newCoordinator.name,
      email: newCoordinator.email,
      school: newCoordinator.school
    };

    res.status(201).json({
      message: 'Coordinator registered successfully',
      token,
      coordinator: coordinatorWithoutPassword
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login coordinator
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find coordinator by email
    const coordinator = await Coordinator.findOne({ email });
    if (!coordinator) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, coordinator.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: coordinator._id }, JWT_SECRET, {
      expiresIn: '1d'
    });

    // Return coordinator data without password
    const coordinatorWithoutPassword = {
      _id: coordinator._id,
      name: coordinator.name,
      email: coordinator.email,
      school: coordinator.school
    };

    res.json({
      message: 'Login successful',
      token,
      coordinator: coordinatorWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token and get coordinator data
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const coordinator = await Coordinator.findById(decoded.id).select('-password');
    if (!coordinator) {
      return res.status(404).json({ message: 'Coordinator not found' });
    }

    res.json({ coordinator });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

export default router;