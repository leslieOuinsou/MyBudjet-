import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Log pour déboguer (seulement en production pour éviter trop de logs)
  if (process.env.NODE_ENV === 'production') {
    console.log('🔐 authenticateJWT - Route:', req.path, 'Method:', req.method);
    console.log('🔐 Authorization header:', authHeader ? 'Présent' : 'Absent');
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ authenticateJWT - No token provided for', req.path);
    return res.status(401).json({ 
      message: 'No token provided',
      path: req.path,
      method: req.method
    });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log('❌ authenticateJWT - User not found for token');
      return res.status(401).json({ 
        message: 'User not found',
        path: req.path
      });
    }
    
    if (req.user.blocked) {
      console.log('❌ authenticateJWT - Account blocked for user:', req.user.email);
      return res.status(403).json({ 
        message: 'Account is blocked',
        email: req.user.email,
        path: req.path
      });
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ authenticateJWT - User authenticated:', req.user.email, 'Role:', req.user.role);
    }
    
    // Update last login (seulement pour les requêtes importantes, pas à chaque GET)
    if (req.method !== 'GET' || req.path.includes('/me') || req.path.includes('/dashboard')) {
      req.user.lastLogin = new Date();
      await req.user.save().catch(err => {
        // Ignorer les erreurs de sauvegarde pour lastLogin
        console.warn('⚠️ Could not update lastLogin:', err.message);
      });
    }
    
    next();
  } catch (err) {
    console.error('❌ authenticateJWT - Error:', err.name, err.message, 'for path:', req.path);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        path: req.path
      });
    }
    res.status(401).json({ 
      message: 'Invalid token',
      error: err.name,
      path: req.path
    });
  }
};
