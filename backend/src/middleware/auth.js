import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Log pour déboguer
  console.log('🔐 authenticateJWT - Route:', req.path, 'Method:', req.method);
  console.log('🔐 Authorization header:', authHeader ? 'Présent' : 'Absent');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ authenticateJWT - No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log('❌ authenticateJWT - User not found');
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (req.user.blocked) {
      console.log('❌ authenticateJWT - Account blocked for user:', req.user.email);
      return res.status(403).json({ message: 'Account is blocked' });
    }
    
    console.log('✅ authenticateJWT - User authenticated:', req.user.email, 'Role:', req.user.role);
    
    // Update last login (seulement pour les requêtes importantes, pas à chaque GET)
    if (req.method !== 'GET' || req.path.includes('/me') || req.path.includes('/dashboard')) {
      req.user.lastLogin = new Date();
      await req.user.save();
    }
    
    next();
  } catch (err) {
    console.error('❌ authenticateJWT - Error:', err.name, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};
