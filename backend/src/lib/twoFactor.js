import crypto from 'crypto';
import prisma from './prisma.js';
import { sendTwoFactorCodeEmail } from '../utils/emailService.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (code) => crypto.createHmac('sha256', process.env.JWT_SECRET).update(code).digest('hex');

/**
 * Crée un défi et envoie le code par email.
 * En production, si l'email part pas, on échoue (jamais de connexion sans second facteur).
 * Hors production, le code est renvoyé dans `devCode` pour pouvoir tester sans SMTP.
 */
export const createChallenge = async (user, purpose) => {
  await prisma.twoFactorChallenge.deleteMany({ where: { userId: user.id, purpose } });

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const challenge = await prisma.twoFactorChallenge.create({
    data: { userId: user.id, purpose, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  const result = await sendTwoFactorCodeEmail(user.email, user.name, code, purpose);
  if (!result.success) {
    if (process.env.NODE_ENV === 'production') {
      await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } });
      return { ok: false };
    }
    console.log(`🔐 [dev] Code 2FA (${purpose}) pour ${user.email} : ${code}`);
    return { ok: true, challengeId: challenge.id, devCode: code };
  }
  return { ok: true, challengeId: challenge.id };
};

/** Vérifie un code. Renvoie { ok, userId } ; le défi est consommé en cas de succès. */
export const verifyChallenge = async ({ challengeId, code, purpose, userId }) => {
  const challenge = await prisma.twoFactorChallenge.findUnique({ where: { id: String(challengeId || '') } });
  if (!challenge || challenge.purpose !== purpose || (userId && challenge.userId !== userId)) {
    return { ok: false, message: 'Code invalide ou expiré' };
  }
  if (challenge.expiresAt < new Date() || challenge.attempts >= MAX_ATTEMPTS) {
    await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    return { ok: false, message: 'Code expiré, demandez-en un nouveau' };
  }

  const expected = Buffer.from(challenge.codeHash, 'hex');
  const given = Buffer.from(hashCode(String(code || '').trim()), 'hex');
  if (!crypto.timingSafeEqual(expected, given)) {
    await prisma.twoFactorChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, message: 'Code incorrect' };
  }

  await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } });
  return { ok: true, userId: challenge.userId };
};

export const isTwoFactorEnabled = async (userId) => {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  return Boolean(prefs?.security?.twoFactorAuth?.enabled);
};
