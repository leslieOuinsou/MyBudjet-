import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

function getMaskedAccountNumber(accountNumber) {
  if (accountNumber && accountNumber.length > 4) {
    const lastFour = accountNumber.slice(-4);
    return `**** **** **** ${lastFour}`;
  }
  return accountNumber;
}

function withMasked(account) {
  const serialized = serialize(account);
  return {
    ...serialized,
    maskedAccountNumber: getMaskedAccountNumber(account.accountNumber),
  };
}

// Obtenir tous les comptes bancaires de l'utilisateur connecté
export const getBankAccounts = async (req, res) => {
  try {
    const uid = userId(req.user);

    const accounts = await prisma.bankAccount.findMany({
      where: { userId: uid, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    const accountsWithMasked = accounts.map(withMasked);

    res.json(accountsWithMasked);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des comptes bancaires:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des comptes' });
  }
};

// Obtenir un compte bancaire spécifique
export const getBankAccountById = async (req, res) => {
  try {
    const uid = userId(req.user);
    const { id } = req.params;

    const account = await prisma.bankAccount.findFirst({
      where: { id, userId: uid },
    });

    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }

    res.json(withMasked(account));
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau compte bancaire
export const createBankAccount = async (req, res) => {
  try {
    const uid = userId(req.user);
    const {
      bankName,
      accountType,
      accountNumber,
      currency,
      balance,
      description,
      color,
      icon,
      isPrimary,
    } = req.body;

    if (!bankName || !accountNumber) {
      return res.status(400).json({ message: 'Nom de la banque et numéro de compte requis' });
    }

    const existingAccounts = await prisma.bankAccount.count({
      where: { userId: uid, isActive: true },
    });
    const isFirstAccount = existingAccounts === 0;
    const lastFourDigits = accountNumber.slice(-4);
    const makePrimary = isFirstAccount ? true : isPrimary || false;

    if (makePrimary) {
      await prisma.bankAccount.updateMany({
        where: { userId: uid, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const newAccount = await prisma.bankAccount.create({
      data: {
        userId: uid,
        bankName,
        accountType: accountType || 'checking',
        accountNumber: lastFourDigits,
        currency: currency || 'EUR',
        balance: balance || 0,
        description,
        color: color || '#1E73BE',
        icon: icon || '🏦',
        isPrimary: makePrimary,
      },
    });

    console.log(`✅ Compte bancaire créé: ${bankName} - ${lastFourDigits}`);

    res.status(201).json({
      message: 'Compte bancaire créé avec succès',
      account: withMasked(newAccount),
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte bancaire:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du compte' });
  }
};

// Mettre à jour un compte bancaire
export const updateBankAccount = async (req, res) => {
  try {
    const uid = userId(req.user);
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.accountNumberFull;
    delete updates.user;
    delete updates.userId;
    delete updates.id;
    delete updates._id;

    const account = await prisma.bankAccount.findFirst({
      where: { id, userId: uid },
    });

    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }

    if (updates.isPrimary === true) {
      await prisma.bankAccount.updateMany({
        where: { userId: uid, isPrimary: true, NOT: { id } },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: updates,
    });

    console.log(`✅ Compte bancaire mis à jour: ${updated.bankName}`);

    res.json({
      message: 'Compte bancaire mis à jour avec succès',
      account: withMasked(updated),
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du compte:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};

// Supprimer un compte bancaire (soft delete)
export const deleteBankAccount = async (req, res) => {
  try {
    const uid = userId(req.user);
    const { id } = req.params;

    const account = await prisma.bankAccount.findFirst({
      where: { id, userId: uid },
    });

    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }

    await prisma.bankAccount.update({
      where: { id },
      data: { isActive: false, isPrimary: false },
    });

    if (account.isPrimary) {
      const nextAccount = await prisma.bankAccount.findFirst({
        where: { userId: uid, isActive: true, NOT: { id } },
      });

      if (nextAccount) {
        await prisma.bankAccount.update({
          where: { id: nextAccount.id },
          data: { isPrimary: true },
        });
      }
    }

    console.log(`✅ Compte bancaire supprimé: ${account.bankName}`);

    res.json({ message: 'Compte bancaire supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
};

// Définir un compte comme principal
export const setPrimaryAccount = async (req, res) => {
  try {
    const uid = userId(req.user);
    const { id } = req.params;

    const account = await prisma.bankAccount.findFirst({
      where: { id, userId: uid, isActive: true },
    });

    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }

    await prisma.$transaction([
      prisma.bankAccount.updateMany({
        where: { userId: uid, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.bankAccount.update({
        where: { id },
        data: { isPrimary: true },
      }),
    ]);

    const updated = await prisma.bankAccount.findUnique({ where: { id } });

    console.log(`✅ Compte principal défini: ${updated.bankName}`);

    res.json({
      message: 'Compte défini comme principal',
      account: withMasked(updated),
    });
  } catch (error) {
    console.error('❌ Erreur lors de la définition du compte principal:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques des comptes bancaires
export const getBankAccountsStats = async (req, res) => {
  try {
    const uid = userId(req.user);

    const accounts = await prisma.bankAccount.findMany({
      where: { userId: uid, isActive: true },
    });

    const stats = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
      byType: {},
      byCurrency: {},
    };

    accounts.forEach((account) => {
      stats.byType[account.accountType] = (stats.byType[account.accountType] || 0) + 1;
      stats.byCurrency[account.currency] =
        (stats.byCurrency[account.currency] || 0) + (account.balance || 0);
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export default {
  getBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryAccount,
  getBankAccountsStats,
};
