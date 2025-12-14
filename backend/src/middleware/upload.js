import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sur Vercel (serverless), utiliser memoryStorage car on ne peut pas créer de dossiers persistants
// En local, utiliser diskStorage
let storage;

if (process.env.VERCEL) {
  // Sur Vercel, utiliser memoryStorage (fichiers en mémoire)
  storage = multer.memoryStorage();
  console.log('📦 Utilisation de memoryStorage (Vercel serverless)');
} else {
  // En local, utiliser diskStorage (fichiers sur disque)
  const uploadsDir = path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    });
    console.log('💾 Utilisation de diskStorage (local)');
  } catch (error) {
    console.warn('⚠️ Impossible de créer le dossier uploads, utilisation de memoryStorage:', error.message);
    storage = multer.memoryStorage();
  }
}

// Filtre pour valider les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.csv', '.xlsx', '.xls'];
  
  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.csv, .xlsx, .xls)'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});
