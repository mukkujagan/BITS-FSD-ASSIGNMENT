import jwt from 'jsonwebtoken';
import { Coordinator } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find coordinator
    const coordinator = await Coordinator.findById(decoded.id);
    
    if (!coordinator) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Add coordinator data to request
    req.coordinator = {
      id: coordinator._id,
      name: coordinator.name,
      email: coordinator.email,
      school: coordinator.school
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;