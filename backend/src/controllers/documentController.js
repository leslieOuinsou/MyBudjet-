import multer from 'multer';
import prisma from '../lib/prisma.js';
import { userId as getUserId } from '../lib/serialize.js';

// Les fonctions serverless Vercel limitent le corps d'une requête à 4,5 Mo
export const MAX_DOCUMENT_SIZE = 4 * 1024 * 1024;
const CATEGORIES = ['ticket', 'facture', 'releve', 'contrat', 'autre'];
const ALLOWED = {
  'application/pdf': (b) => b.subarray(0, 4).toString() === '%PDF',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  'image/png': (b) => b.subarray(1, 4).toString() === 'PNG',
  'image/webp': (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
};

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    return cb(new Error('Format non supporté. Importez un PDF, JPG, PNG ou WebP.'));
  },
});

// Pas de `data` dans les listes : seuls les métadonnées transitent
const PUBLIC_FIELDS = { id: true, name: true, originalName: true, mimeType: true, size: true, category: true, note: true, expiresAt: true, createdAt: true };
const toJson = (d) => ({ ...d, _id: d.id });

// '' / null = pas d'échéance ; date invalide = ignorée
const parseExpiry = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const listDocuments = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { category, q, expiring } = req.query;
    const documents = await prisma.document.findMany({
      where: {
        userId: uid,
        ...(category && CATEGORIES.includes(category) ? { category } : {}),
        ...(q ? { name: { contains: String(q), mode: 'insensitive' } } : {}),
        ...(expiring ? { expiresAt: { not: null, lte: new Date(Date.now() + 30 * 86400000) } } : {}),
      },
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
    const total = documents.reduce((sum, d) => sum + d.size, 0);
    res.json({ documents: documents.map(toJson), totalSize: total });
  } catch (error) {
    console.error('Erreur liste documents:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des documents' });
  }
};

export const createDocument = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Aucun fichier reçu' });
    if (!ALLOWED[file.mimetype]?.(file.buffer)) {
      return res.status(400).json({ message: "Le contenu du fichier ne correspond pas à son format" });
    }

    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const category = CATEGORIES.includes(req.body.category) ? req.body.category : 'autre';
    const name = (req.body.name || originalName).trim().slice(0, 120) || originalName;

    const doc = await prisma.document.create({
      data: {
        userId: uid,
        name,
        originalName: originalName.slice(0, 255),
        mimeType: file.mimetype,
        size: file.size,
        category,
        note: req.body.note ? String(req.body.note).slice(0, 500) : null,
        expiresAt: parseExpiry(req.body.expiresAt) ?? null,
        data: file.buffer,
      },
      select: PUBLIC_FIELDS,
    });
    res.status(201).json(toJson(doc));
  } catch (error) {
    console.error('Erreur import document:', error);
    res.status(500).json({ message: "Erreur lors de l'import du document" });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, userId: uid } });
    if (!doc) return res.status(404).json({ message: 'Document introuvable' });

    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Length', doc.size);
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(Buffer.from(doc.data));
  } catch (error) {
    console.error('Erreur téléchargement document:', error);
    res.status(500).json({ message: 'Erreur lors du téléchargement' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: uid }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: 'Document introuvable' });

    const data = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim().slice(0, 120);
    if (CATEGORIES.includes(req.body.category)) data.category = req.body.category;
    if (typeof req.body.note === 'string') data.note = req.body.note.slice(0, 500) || null;
    const expiry = parseExpiry(req.body.expiresAt);
    if (expiry !== undefined) {
      data.expiresAt = expiry;
      data.expiryRemindedAt = null; // nouvelle échéance : on re-prévient
    }

    const doc = await prisma.document.update({ where: { id: existing.id }, data, select: PUBLIC_FIELDS });
    res.json(toJson(doc));
  } catch (error) {
    console.error('Erreur modification document:', error);
    res.status(500).json({ message: 'Erreur lors de la modification' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { count } = await prisma.document.deleteMany({ where: { id: req.params.id, userId: uid } });
    if (!count) return res.status(404).json({ message: 'Document introuvable' });
    res.json({ message: 'Document supprimé' });
  } catch (error) {
    console.error('Erreur suppression document:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

// Erreurs multer (taille, format) renvoyées en JSON lisible
export const handleUploadError = (err, req, res, next) => {
  if (!err) return next();
  const message = err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (4 Mo maximum).' : err.message;
  return res.status(400).json({ message });
};
