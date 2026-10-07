import prisma from '../lib/prisma.js';
import { userId } from '../lib/serialize.js';

// Taux du jour, source gratuite sans clé (Frankfurter / BCE), cache mémoire 6 h
const TTL_MS = 6 * 3600 * 1000;
const cache = new Map();

export const getRates = async (base) => {
  const hit = cache.get(base);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rates;

  const response = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`);
  if (!response.ok) throw new Error('Service de taux de change indisponible');
  const data = await response.json();
  const rates = { ...data.rates, [base]: 1 };
  cache.set(base, { at: Date.now(), rates });
  return rates;
};

export const listRates = async (req, res) => {
  const base = String(req.query.base || 'EUR').toUpperCase();
  try {
    res.json({ base, rates: await getRates(base) });
  } catch (error) {
    res.status(502).json({ message: error.message });
  }
};

// Soldes de tous les comptes convertis dans une devise commune
export const getAccountsSummary = async (req, res) => {
  const base = String(req.query.base || 'EUR').toUpperCase();
  const accounts = await prisma.bankAccount.findMany({ where: { userId: userId(req.user), isActive: true } });

  try {
    const rates = await getRates(base);
    let missing = 0;
    const converted = accounts.map((a) => {
      // rates = combien de X pour 1 base ; conversion X -> base = montant / taux
      const rate = rates[a.currency];
      if (!rate) missing++;
      return {
        id: a.id,
        bankName: a.bankName,
        currency: a.currency,
        balance: a.balance,
        balanceInBase: rate ? Math.round((a.balance / rate) * 100) / 100 : null,
      };
    });
    const total = converted.reduce((s, a) => s + (a.balanceInBase || 0), 0);
    res.json({ base, accounts: converted, total: Math.round(total * 100) / 100, unconvertible: missing });
  } catch (error) {
    res.status(502).json({ message: error.message });
  }
};
