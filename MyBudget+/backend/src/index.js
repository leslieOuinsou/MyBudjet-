import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import './config/passport.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import walletRoutes from './routes/wallets.js';
import transactionRoutes from './routes/transactions.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import recurringRoutes from './routes/recurring.js';
import transferRoutes from './routes/transfer.js';
import importExportRoutes from './routes/importexport.js';
import dashboardRoutes from './routes/dashboard.js';
import budgetRoutes from './routes/budgets.js';
import billReminderRoutes from './routes/billreminders.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import reportsRoutes from './routes/reports.js';
import forecastRoutes from './routes/forecasts.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Plus permissif en développement
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Middlewares
app.use(express.json());

// Configuration Helmet pour autoriser les images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/', limiter);

// CSRF Protection (must be before routes)
// Désactivé en développement pour faciliter les tests
if (process.env.NODE_ENV === 'production') {
  const csrfProtection = csrf({ cookie: false });
  const csrfExcluded = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/google',
    '/api/auth/google/callback'
  ];

  app.use((req, res, next) => {
    if (
      req.method === 'GET' ||
      req.method === 'HEAD' ||
      req.method === 'OPTIONS' ||
      csrfExcluded.includes(req.path)
    ) {
      return next();
    }
    csrfProtection(req, res, next);
  });
  console.log('✅ CSRF Protection enabled');
} else {
  console.log('⚠️  CSRF Protection disabled (development mode)');
}

// Apply rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/importexport', importExportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/billreminders', billReminderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Route de test pour vérifier que le serveur fonctionne
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Route de test pour vérifier que les routes reports sont chargées
app.get('/api/test-reports', (req, res) => {
  res.json({ message: 'Reports routes are loaded', availableRoutes: ['/stats', '/categories', '/top-transactions'] });
});

console.log('✅ Routes configurées:');
console.log('   - /api/reports/stats');
console.log('   - /api/reports/categories');
console.log('   - /api/reports/top-transactions');
console.log('   - /api/health (test)');

// 404 Handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler - Must be last
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // CSRF Error
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: Object.values(err.errors).map(e => e.message) 
    });
  }
  
  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate entry', 
      field: Object.keys(err.keyPattern)[0] 
    });
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }
  
  // Default Error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(statusCode).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

// Validate required environment variables
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  console.error('💡 Copy .env.example to .env and configure it');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables');
  console.error('💡 Generate a secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not defined in environment variables');
  console.error('💡 Generate a secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

console.log('✅ Environment variables validated');

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ========================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/health`);
      console.log('🎉 ========================================');
      console.log('');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('💡 Make sure MongoDB is running (mongod or docker-compose up -d mongo)');
    process.exit(1);
  });
