import multer from 'multer';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { userId } from '../lib/serialize.js';
import { askClaude, parseJsonReply, isClaudeConfigured } from '../lib/claude.js';

const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];

export const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED_IMAGES.includes(file.mimetype) ? cb(null, true) : cb(new Error('Image JPEG, PNG ou WebP uniquement')),
}).single('receipt');

// Chaque appel coûte de l'argent : plafond par utilisateur
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => userId(req.user) || req.ip,
  message: { message: 'Limite de requêtes IA atteinte, réessayez dans une heure.' },
});

export const requireClaude = (req, res, next) => {
  if (!isClaudeConfigured()) {
    return res.status(503).json({ message: 'Fonction IA non configurée : ajoutez ANTHROPIC_API_KEY côté serveur.' });
  }
  next();
};

// Lit une photo de ticket et renvoie une transaction pré-remplie (rien n'est enregistré)
export const scanReceipt = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image du ticket requise (champ « receipt »)' });
  const uid = userId(req.user);

  const categories = await prisma.category.findMany({ where: { userId: uid, type: 'expense' }, select: { id: true, name: true } });

  try {
    const text = await askClaude({
      system:
        'Tu lis des tickets de caisse. Réponds uniquement par un objet JSON : ' +
        '{"description": string (nom du commerçant), "amount": number (total TTC), "date": "YYYY-MM-DD" ou null, "category": un nom exact de la liste fournie ou null}. ' +
        'Si l\'image n\'est pas un ticket lisible, réponds {"error": "illisible"}.',
      content: [
        { type: 'image', source: { type: 'base64', media_type: req.file.mimetype, data: req.file.buffer.toString('base64') } },
        { type: 'text', text: `Catégories disponibles : ${categories.map((c) => c.name).join(', ') || 'aucune'}` },
      ],
      maxTokens: 300,
    });

    const parsed = parseJsonReply(text);
    if (parsed.error || !(Number(parsed.amount) > 0)) {
      return res.status(422).json({ message: 'Ticket illisible, saisissez la dépense à la main.' });
    }
    const category = categories.find((c) => c.name.toLowerCase() === String(parsed.category || '').toLowerCase());
    res.json({
      description: String(parsed.description || '').slice(0, 120),
      amount: Math.round(Number(parsed.amount) * 100) / 100,
      date: parsed.date || null,
      categoryId: category?.id || null,
      categoryName: category?.name || null,
    });
  } catch (error) {
    console.error('Erreur scanReceipt:', error.message);
    res.status(502).json({ message: 'Le service IA a échoué, réessayez.' });
  }
};

// Répond à une question en langage naturel à partir d'un RÉSUMÉ des finances (montants par catégorie)
export const askAssistant = async (req, res) => {
  const question = String(req.body.question || '').trim().slice(0, 500);
  if (!question) return res.status(400).json({ message: 'Question requise' });
  const uid = userId(req.user);

  const since = new Date();
  since.setMonth(since.getMonth() - 3);
  since.setDate(1);

  const txs = await prisma.transaction.findMany({
    where: { userId: uid, date: { gte: since } },
    select: { amount: true, type: true, date: true, category: { select: { name: true } } },
  });

  // Seuls des totaux agrégés quittent le serveur : ni libellés, ni notes, ni identité
  const summary = {};
  for (const t of txs) {
    const month = t.date.toISOString().slice(0, 7);
    const key = `${month} | ${t.type === 'income' ? 'revenu' : 'dépense'} | ${t.category?.name || 'Sans catégorie'}`;
    summary[key] = Math.round(((summary[key] || 0) + t.amount) * 100) / 100;
  }
  const lines = Object.entries(summary).sort().map(([k, v]) => `${k} : ${v} €`);

  try {
    const answer = await askClaude({
      system:
        'Tu es l\'assistant budget de l\'application MyBudget. Réponds en français, simplement, en 5 phrases maximum, ' +
        'uniquement à partir des données fournies. Si les données ne permettent pas de répondre, dis-le. ' +
        `Date du jour : ${new Date().toISOString().slice(0, 10)}.`,
      content: `Totaux des 3 derniers mois (mois | type | catégorie : total) :\n${lines.join('\n') || 'Aucune donnée'}\n\nQuestion : ${question}`,
      maxTokens: 500,
    });
    res.json({ answer });
  } catch (error) {
    console.error('Erreur askAssistant:', error.message);
    res.status(502).json({ message: 'Le service IA a échoué, réessayez.' });
  }
};

export const aiStatus = (req, res) => res.json({ configured: isClaudeConfigured() });
