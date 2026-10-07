import 'dotenv/config';

// Empêche un DATABASE_URL exporté avec des guillemets (ex: "postgresql://...") de casser Prisma
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

import express from 'express';

console.log('🔍 Debug - Variables d\'environnement:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurée' : '❌ Non configurée');
console.log('RECAPTCHA_SECRET_KEY:', process.env.RECAPTCHA_SECRET_KEY ? '✅ Configurée' : '❌ Non configurée');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurée' : '❌ Non configurée');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ Non configurée');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurée (masquée)' : '❌ Non configurée');
console.log('PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? '✅ Configurée' : '❌ Non configurée');
console.log('PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? '✅ Configurée (masquée)' : '❌ Non configurée');
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE ? `✅ ${process.env.PAYPAL_MODE}` : '❌ Non configurée');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurée' : '❌ Non configurée');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurée' : '❌ Non configurée');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? `✅ ${process.env.TWILIO_PHONE_NUMBER}` : '❌ Non configurée');

import prisma from './lib/prisma.js';
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
import goalRoutes from './routes/goals.js';
import billReminderRoutes from './routes/billreminders.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import reportsRoutes from './routes/reports.js';
import forecastRoutes from './routes/forecasts.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import cronRoutes from './routes/cron.js';
import sharedBudgetRoutes from './routes/sharedBudgets.js';
import currencyRoutes from './routes/currency.js';
import bankAccountRoutes from './routes/bankAccounts.js';
import importBankRoutes from './routes/importBank.js';
import paypalRoutes from './routes/paypal.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

if (process.env.VERCEL) {
  app.set('trust proxy', 1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isConnecting = false;
let connectionPromise = null;
let isReady = false;

async function connectDatabase() {
  if (isReady) return;
  if (isConnecting && connectionPromise) return connectionPromise;

  if (!process.env.DATABASE_URL) {
    const error = '❌ DATABASE_URL is not defined in environment variables';
    console.error(error);
    if (!process.env.VERCEL) process.exit(1);
    throw new Error(error);
  }

  if (!process.env.JWT_SECRET) {
    const error = '❌ JWT_SECRET is not defined in environment variables';
    console.error(error);
    if (!process.env.VERCEL) process.exit(1);
    throw new Error(error);
  }

  if (!process.env.SESSION_SECRET) {
    const error = '❌ SESSION_SECRET is not defined in environment variables';
    console.error(error);
    if (!process.env.VERCEL) process.exit(1);
    throw new Error(error);
  }

  isConnecting = true;
  console.log('🔄 Connexion à PostgreSQL...', process.env.VERCEL ? '(Vercel serverless)' : '(local)');

  connectionPromise = prisma.$connect()
    .then(async () => {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL connected');

      const { createDefaultAdmin } = await import('./utils/createDefaultAdmin.js');
      await createDefaultAdmin();

      isReady = true;
      isConnecting = false;
      return true;
    })
    .catch(err => {
      isConnecting = false;
      connectionPromise = null;
      isReady = false;
      console.error('❌ PostgreSQL connection error:', err);
      if (!process.env.VERCEL) {
        console.error('💡 Lancez PostgreSQL: docker compose up -d postgres');
        process.exit(1);
      }
      throw err;
    });

  return connectionPromise;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('vercel.app')) return callback(null, true);
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
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
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
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/', limiter);

if (false && process.env.NODE_ENV === 'production') {
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
  console.log('⚠️  CSRF Protection disabled (JWT authentication is used instead)');
}

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login/2fa', authLimiter);

app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    console.error('❌ Erreur de connexion PostgreSQL dans le middleware:', err);
    res.status(500).json({
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

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
app.use('/api/goals', goalRoutes);
app.use('/api/billreminders', billReminderRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/import-bank', importBankRoutes);
app.use('/api/paypal', paypalRoutes);

app.get('/callback', (req, res) => {
  console.log('🔄 Callback PayPal reçu:', req.query);
  const { code, error } = req.query;
  if (code) {
    res.redirect(`${process.env.FRONTEND_URL}/paypal?code=${code}`);
  } else if (error) {
    res.redirect(`${process.env.FRONTEND_URL}/paypal?error=${error}`);
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
app.use('/api/cron', cronRoutes);
app.use('/api/shared-budgets', sharedBudgetRoutes);
app.use('/api/currency', currencyRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'MyBudget API Server',
    status: 'running',
    version: '1.0.0',
    database: 'PostgreSQL + Prisma',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      transactions: '/api/transactions',
      categories: '/api/categories',
      wallets: '/api/wallets',
      dashboard: '/api/dashboard',
      budgets: '/api/budgets'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/test-reports', (req, res) => {
  res.json({ message: 'Reports routes are loaded', availableRoutes: ['/stats', '/categories', '/top-transactions'] });
});

console.log('✅ Routes configurées:');
console.log('   - /api/reports/stats');
console.log('   - /api/reports/categories');
console.log('   - /api/reports/top-transactions');
console.log('   - /api/health (test)');

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/transactions',
      'GET /api/categories',
      'GET /api/wallets',
      'GET /api/dashboard'
    ],
    hint: 'All API routes are prefixed with /api'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  // Multer / upload errors
  if (err.name === 'MulterError' || err.message?.includes('Format de fichier') || err.message?.includes('File too large')) {
    return res.status(400).json({ message: err.message });
  }
  if (err instanceof Error && err.message && (
    err.message.includes('non supporté') ||
    err.message.includes('CSV') ||
    err.message.includes('image')
  )) {
    return res.status(400).json({ message: err.message });
  }

  // Prisma validation
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ message: 'Validation error', error: err.message });
  }

  // Prisma unique constraint
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(400).json({ message: 'Duplicate entry', field });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;

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

export default app;
