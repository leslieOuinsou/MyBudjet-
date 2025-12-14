import 'dotenv/config';
import express from 'express';

// Debug: Vérifier les variables d'environnement
console.log('🔍 Debug - Variables d\'environnement:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurée' : '❌ Non configurée');
console.log('RECAPTCHA_SECRET_KEY:', process.env.RECAPTCHA_SECRET_KEY ? '✅ Configurée' : '❌ Non configurée');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Configurée' : '❌ Non configurée');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ Non configurée');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurée (masquée)' : '❌ Non configurée');
console.log('PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? '✅ Configurée' : '❌ Non configurée');
console.log('PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? '✅ Configurée (masquée)' : '❌ Non configurée');
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE ? `✅ ${process.env.PAYPAL_MODE}` : '❌ Non configurée');
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
import bankAccountRoutes from './routes/bankAccounts.js';
import importBankRoutes from './routes/importBank.js';
import paypalRoutes from './routes/paypal.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour initialiser la connexion MongoDB
// Sur Vercel, cette fonction sera appelée à chaque invocation si la connexion n'existe pas
let isConnecting = false;
let connectionPromise = null;

async function connectDatabase() {
  // Si déjà connecté, retourner
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Si une connexion est en cours, attendre qu'elle se termine
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  const MONGO_URI = process.env.MONGO_URI;

  // Validate required environment variables
  if (!MONGO_URI) {
    const error = '❌ MONGO_URI is not defined in environment variables';
    console.error(error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw new Error(error);
  }

  if (!process.env.JWT_SECRET) {
    const error = '❌ JWT_SECRET is not defined in environment variables';
    console.error(error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw new Error(error);
  }

  if (!process.env.SESSION_SECRET) {
    const error = '❌ SESSION_SECRET is not defined in environment variables';
    console.error(error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw new Error(error);
  }

  // Démarrer la connexion
  isConnecting = true;
  
  // Configuration optimisée pour Vercel serverless
  const mongoOptions = {
    serverSelectionTimeoutMS: 30000, // 30 secondes pour la sélection du serveur
    socketTimeoutMS: 45000, // 45 secondes pour les opérations socket
    connectTimeoutMS: 30000, // 30 secondes pour la connexion initiale
    maxPoolSize: process.env.VERCEL ? 1 : 10, // Pool size minimal sur Vercel
    minPoolSize: process.env.VERCEL ? 0 : 1,
    maxIdleTimeMS: 10000, // Fermer les connexions inactives après 10s
  };
  
  // Désactiver le buffering des commandes Mongoose pour éviter les timeouts
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferTimeoutMS', 30000);
  
  console.log('🔄 Connexion à MongoDB...', process.env.VERCEL ? '(Vercel serverless)' : '(local)');
  
  connectionPromise = mongoose.connect(MONGO_URI, mongoOptions)
    .then(async () => {
      console.log('✅ MongoDB connected');
      
      // Créer un admin par défaut si aucun n'existe (seulement la première fois)
      // Vérifier si c'est une nouvelle connexion
      const { createDefaultAdmin } = await import('./utils/createDefaultAdmin.js');
      await createDefaultAdmin();
      
      isConnecting = false;
      return true;
    })
    .catch(err => {
      isConnecting = false;
      connectionPromise = null;
      console.error('❌ MongoDB connection error:', err);
      if (!process.env.VERCEL) {
        console.error('💡 Make sure MongoDB is running (mongod or docker-compose up -d mongo)');
        process.exit(1);
      }
      throw err;
    });

  return connectionPromise;
}

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

// Configuration CORS - DOIT être AVANT express.json() et tous les autres middlewares
// Configuration simplifiée et fonctionnelle pour Vercel

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Autoriser tous les domaines Vercel en production
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Autoriser les URLs locales en développement
    const localOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ];
    
    if (localOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Autoriser aussi FRONTEND_URL si configuré
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // Par défaut, autoriser (pour faciliter le déploiement)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 204
};

// Appliquer CORS AVANT express.json()
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());

// Configuration Helmet pour autoriser les images (après CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
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

// Middleware pour s'assurer que MongoDB est connecté AVANT de traiter les requêtes
// DOIT être placé AVANT les routes
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB dans le middleware:', err);
    res.status(500).json({ 
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

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
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/import-bank', importBankRoutes);
app.use('/api/paypal', paypalRoutes);

// Route spéciale pour le callback PayPal
app.get('/callback', (req, res) => {
  console.log('🔄 Callback PayPal reçu:', req.query);
  const { code, error } = req.query;
  if (code) {
    const frontendUrl = `${process.env.FRONTEND_URL}/paypal?code=${code}`;
    res.redirect(frontendUrl);
  } else if (error) {
    const frontendUrl = `${process.env.FRONTEND_URL}/paypal?error=${error}`;
    res.redirect(frontendUrl);
  } else {
    res.redirect(`${process.env.FRONTEND_URL}/paypal?error=unknown`);
  }
});
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

// Démarrer le serveur seulement si on n'est pas sur Vercel
// Sur Vercel, l'app est exportée et utilisée comme fonction serverless
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  
  // Initialiser la connexion et démarrer le serveur
  connectDatabase()
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
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

// Exporter l'application pour Vercel
export default app;
