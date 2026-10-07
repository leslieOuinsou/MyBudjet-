import jwt from 'jsonwebtoken';
import prisma from './prisma.js';

const clientIp = (req) => (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim() || null;

/** Crée une session (visible dans Paramètres > Sessions actives) et renvoie un JWT qui la référence. */
export const issueToken = async (userId, req) => {
  const session = await prisma.userSession.create({
    data: {
      userId,
      userAgent: (req?.headers?.['user-agent'] || '').slice(0, 250) || null,
      ip: req ? clientIp(req) : null,
    },
  });
  return jwt.sign({ id: userId, sid: session.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Évite une écriture en base à chaque requête
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Vérifie que la session du jeton n'est pas révoquée.
 * Les anciens jetons sans `sid` (émis avant cette fonction) restent acceptés jusqu'à leur expiration.
 */
export const checkSession = async (decoded) => {
  if (!decoded.sid) return { ok: true, sessionId: null };
  const session = await prisma.userSession.findUnique({ where: { id: decoded.sid } });
  if (!session || session.revokedAt || session.userId !== decoded.id) return { ok: false };
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    prisma.userSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { ok: true, sessionId: session.id };
};
