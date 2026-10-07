import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';
import nodemailer from 'nodemailer';
import { logActivity, snapshot, diff, describe } from '../lib/activityLog.js';
import {
  createBudgetAlertNotification,
  createBudgetExceededNotification,
} from '../utils/notificationGenerator.js';

async function checkBudgetAndNotify(transaction) {
  if (transaction.type === 'expense' && transaction.categoryId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spent = await prisma.transaction.aggregate({
      where: {
        userId: transaction.userId,
        categoryId: transaction.categoryId,
        type: 'expense',
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });
    const totalSpent = spent._sum.amount || 0;
    const budget = await prisma.budget.findFirst({
      where: {
        userId: transaction.userId,
        categoryId: transaction.categoryId,
        period: 'month',
      },
    });

    const category = await prisma.category.findUnique({
      where: { id: transaction.categoryId },
    });
    const categoryLabel = category?.name || transaction.categoryId;

    if (budget) {
      const percentage = Math.round((totalSpent / budget.amount) * 100);
      const remaining = budget.amount - totalSpent;

      if (percentage >= 80 && percentage < 100 && remaining > 0) {
        await createBudgetAlertNotification(
          transaction.userId,
          categoryLabel,
          percentage,
          Math.abs(remaining)
        );
      }

      if (totalSpent > budget.amount) {
        const exceeded = totalSpent - budget.amount;
        await createBudgetExceededNotification(
          transaction.userId,
          categoryLabel,
          Math.abs(exceeded)
        );
      }
    }
  }

  if (transaction.walletId && transaction.type === 'expense') {
    const wallet = await prisma.wallet.findUnique({ where: { id: transaction.walletId } });
    if (wallet && wallet.balance < 0) {
      console.log(`⚠️ Solde négatif détecté (${wallet.balance} €) pour le portefeuille ${wallet.name}`);

      const user = await prisma.user.findUnique({ where: { id: transaction.userId } });

      if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });

          await transporter.sendMail({
            to: user.email,
            subject: '⚠️ Alerte: Solde négatif',
            html: `
              <h2 style="color: #dc2626;">Alerte de Solde Négatif</h2>
              <p>Cher/Chère ${user.name},</p>
              <p>Le solde de votre portefeuille <strong>${wallet.name}</strong> est maintenant négatif.</p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Solde actuel:</strong> ${wallet.balance.toFixed(2)} €</p>
                <p><strong>Découvert autorisé:</strong> -${(wallet.overdraftLimit || 0).toFixed(2)} €</p>
              </div>
              <p style="color: #dc2626; font-weight: bold;">Veuillez approvisionner votre compte.</p>
            `,
          });
          console.log('✅ Email d\'alerte solde négatif envoyé à', user.email);
        } catch (err) {
          console.error('⚠️ Erreur envoi email:', err.message);
        }
      }
    }
  }
}

export const getTransactions = async (req, res) => {
  const { category, wallet, startDate, endDate, search } = req.query;
  const where = { userId: userId(req.user) };
  if (category) where.categoryId = category;
  if (wallet) where.walletId = wallet;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [{ description: { contains: search, mode: 'insensitive' } }];
    if (!isNaN(Number(search))) {
      where.OR.push({ amount: Number(search) });
    }
  }
  const transactions = serialize(
    await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
      orderBy: { date: 'desc' },
    })
  );
  res.json(transactions);
};

export const getTransaction = async (req, res) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: userId(req.user) },
    include: { category: true, wallet: true },
  });
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  res.json(serialize(transaction));
};

export const createTransaction = async (req, res) => {
  const { amount, type, category, wallet, date, description, note, notes } = req.body;
  const finalNote = note || notes || '';
  let attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
  const uid = userId(req.user);
  const categoryId = category || null;
  const walletId = wallet || null;

  console.log('🔄 Création de transaction:', { amount, type, category, wallet, description, note: finalNote });

  if (type === 'expense' && walletId) {
    console.log('💰 Vérification du portefeuille pour dépense...');
    const walletDoc = await prisma.wallet.findUnique({ where: { id: walletId } });
    console.log('💳 Portefeuille trouvé:', walletDoc ? `${walletDoc.name} (${walletDoc.balance} €)` : 'Non trouvé');

    if (walletDoc) {
      const expenseAmount = parseFloat(amount);
      const newBalance = walletDoc.balance - expenseAmount;
      const overdraftLimit = walletDoc.overdraftLimit || 0;

      if (newBalance < -overdraftLimit) {
        const deficit = Math.abs(newBalance + overdraftLimit);
        console.log(`❌ Découvert autorisé dépassé ! Déficit: ${deficit}€`);

        const user = await prisma.user.findUnique({ where: { id: uid } });

        if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            await transporter.sendMail({
              to: user.email,
              subject: '🚨 Alerte: Découvert autorisé dépassé',
              html: `
                <h2 style="color: #dc2626;">Alerte de Découvert</h2>
                <p>Cher/Chère ${user.name},</p>
                <p>Une tentative de dépense a été refusée car elle dépasserait votre découvert autorisé.</p>
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Portefeuille:</strong> ${walletDoc.name}</p>
                  <p><strong>Solde actuel:</strong> ${walletDoc.balance.toFixed(2)} €</p>
                  <p><strong>Découvert autorisé:</strong> -${overdraftLimit.toFixed(2)} €</p>
                  <p><strong>Montant de la dépense refusée:</strong> ${expenseAmount.toFixed(2)} €</p>
                  <p><strong>Dépassement:</strong> ${deficit.toFixed(2)} €</p>
                </div>
                <p style="color: #dc2626; font-weight: bold;">➡️ Cette dépense a été refusée pour protéger vos finances.</p>
                <p>Veuillez approvisionner votre compte ou réduire le montant de la dépense.</p>
              `,
            });
            console.log('✅ Email d\'alerte découvert envoyé à', user.email);
          } catch (err) {
            console.error('⚠️ Erreur envoi email:', err.message);
          }
        }

        return res.status(400).json({
          message: `Dépense refusée : découvert autorisé dépassé de ${deficit.toFixed(2)}€. Solde actuel: ${walletDoc.balance.toFixed(2)}€, Découvert autorisé: -${overdraftLimit.toFixed(2)}€`,
        });
      }

      console.log(`✅ Découvert OK. Nouveau solde: ${newBalance.toFixed(2)}€ (limite: -${overdraftLimit}€)`);
    }
  } else {
    console.log('ℹ️ Pas de vérification de portefeuille (pas une dépense ou pas de portefeuille)');
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      type,
      categoryId,
      walletId,
      userId: uid,
      date: date ? new Date(date) : undefined,
      description: description || finalNote || '',
      note: finalNote,
      attachment,
    },
    include: { category: true, wallet: true },
  });

  await logActivity({ userId: uid, entityId: transaction.id, action: 'create', summary: `${describe(transaction)} ajoutée`, after: snapshot(transaction) });

  if (walletId && type) {
    const walletToUpdate = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (walletToUpdate) {
      const oldBalance = walletToUpdate.balance;
      console.log(`💳 Portefeuille: ${walletToUpdate.name}`);
      console.log(`💳 Solde AVANT transaction: ${oldBalance}€`);
      console.log(`💰 Transaction: ${type} de ${amount}€`);

      const delta = type === 'expense' ? -parseFloat(amount) : type === 'income' ? parseFloat(amount) : 0;
      if (delta !== 0) {
        await prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: delta } },
        });
        console.log(`💰 Nouveau solde: ${oldBalance + delta}€`);
        console.log(`📊 Calcul: ${oldBalance} ${type === 'expense' ? '-' : '+'} ${amount} = ${oldBalance + delta}`);
      }
    }
  }

  await checkBudgetAndNotify(transaction);
  res.status(201).json(serialize(transaction));
};

export const updateTransaction = async (req, res) => {
  const { amount, type, category, wallet, date, description, note, notes } = req.body;
  const finalNote = note || notes || '';

  const oldTransaction = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: userId(req.user) } });
  if (!oldTransaction) return res.status(404).json({ message: 'Transaction not found' });

  const data = {
    amount: amount !== undefined ? parseFloat(amount) : undefined,
    type,
    categoryId: category !== undefined ? category || null : undefined,
    walletId: wallet !== undefined ? wallet || null : undefined,
    date: date ? new Date(date) : undefined,
    // Un champ absent de la requête n'écrase plus la valeur existante
    description: description || finalNote || undefined,
    note: note !== undefined || notes !== undefined ? finalNote : undefined,
  };
  if (req.file) data.attachment = `/uploads/${req.file.filename}`;

  // Nettoyer les undefined
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  if (oldTransaction.walletId) {
    const restoreDelta =
      oldTransaction.type === 'expense'
        ? oldTransaction.amount
        : oldTransaction.type === 'income'
          ? -oldTransaction.amount
          : 0;
    if (restoreDelta !== 0) {
      await prisma.wallet.update({
        where: { id: oldTransaction.walletId },
        data: { balance: { increment: restoreDelta } },
      });
    }
  }

  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data,
    include: { category: true, wallet: true },
  });

  const newWalletId = wallet !== undefined ? wallet || null : transaction.walletId;
  const newType = type || transaction.type;
  const newAmount = amount !== undefined ? parseFloat(amount) : transaction.amount;

  if (newWalletId && newType) {
    const delta = newType === 'expense' ? -newAmount : newType === 'income' ? newAmount : 0;
    if (delta !== 0) {
      const walletToUpdate = await prisma.wallet.update({
        where: { id: newWalletId },
        data: { balance: { increment: delta } },
      });
      console.log(`💰 Solde du portefeuille ${walletToUpdate.name} mis à jour: ${walletToUpdate.balance}€`);
    }
  }

  const changes = diff(snapshot(oldTransaction), snapshot(transaction));
  if (changes.length > 0) {
    await logActivity({
      userId: userId(req.user),
      entityId: transaction.id,
      action: 'update',
      summary: `${describe(transaction)} modifiée`,
      before: snapshot(oldTransaction),
      after: snapshot(transaction),
    });
  }

  await checkBudgetAndNotify(transaction);
  res.json(serialize(transaction));
};

// Variation de solde d'un portefeuille quand la transaction existe (dépense : -, revenu : +)
const walletDelta = (t) => (t.type === 'expense' ? -t.amount : t.type === 'income' ? t.amount : 0);

async function applyToWallet(t, sign) {
  const delta = walletDelta(t) * sign;
  if (!t.walletId || delta === 0) return;
  await prisma.wallet.update({ where: { id: t.walletId }, data: { balance: { increment: delta } } }).catch(() => null);
}

const TRASH_DAYS = 30;

// Suppression = mise à la corbeille (30 jours) : le solde du portefeuille est rétabli, la restauration le réapplique
export const deleteTransaction = async (req, res) => {
  const uid = userId(req.user);
  const transaction = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: uid } });
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

  await applyToWallet(transaction, -1);
  await prisma.transaction.update({ where: { id: transaction.id }, data: { deletedAt: new Date() } });
  await logActivity({ userId: uid, entityId: transaction.id, action: 'delete', summary: `${describe(transaction)} mise à la corbeille`, before: snapshot(transaction) });

  res.json({ message: 'Transaction deleted', id: transaction.id, restorableUntil: new Date(Date.now() + TRASH_DAYS * 86400000) });
};

export const getTrash = async (req, res) => {
  const items = await prisma.transaction.findMany({
    where: { userId: userId(req.user), deletedAt: { not: null } },
    include: { category: true, wallet: true },
    orderBy: { deletedAt: 'desc' },
  });
  res.json(serialize(items.map((t) => ({ ...t, purgeAt: new Date(t.deletedAt.getTime() + TRASH_DAYS * 86400000) }))));
};

export const restoreTransaction = async (req, res) => {
  const uid = userId(req.user);
  const transaction = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: uid, deletedAt: { not: null } } });
  if (!transaction) return res.status(404).json({ message: 'Transaction introuvable dans la corbeille' });

  await applyToWallet(transaction, 1);
  const restored = await prisma.transaction.update({ where: { id: transaction.id }, data: { deletedAt: null }, include: { category: true, wallet: true } });
  await logActivity({ userId: uid, entityId: transaction.id, action: 'restore', summary: `${describe(transaction)} restaurée`, after: snapshot(transaction) });
  res.json(serialize(restored));
};

// Suppression définitive (le solde a déjà été rétabli à la mise à la corbeille)
export const purgeTransaction = async (req, res) => {
  const uid = userId(req.user);
  const transaction = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: uid, deletedAt: { not: null } } });
  if (!transaction) return res.status(404).json({ message: 'Transaction introuvable dans la corbeille' });
  await prisma.transaction.delete({ where: { id: transaction.id } });
  await logActivity({ userId: uid, entityId: transaction.id, action: 'purge', summary: `${describe(transaction)} supprimée définitivement`, before: snapshot(transaction) });
  res.json({ message: 'Supprimée définitivement' });
};

export const emptyTrash = async (req, res) => {
  const uid = userId(req.user);
  const { count } = await prisma.transaction.deleteMany({ where: { userId: uid, deletedAt: { not: null } } });
  if (count > 0) await logActivity({ userId: uid, entityId: 'trash', action: 'purge', summary: `Corbeille vidée (${count} transaction${count > 1 ? 's' : ''})` });
  res.json({ message: 'Corbeille vidée', count });
};

export const getActivity = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  const items = await prisma.activityLog.findMany({
    where: { userId: userId(req.user) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(serialize(items));
};

// Appelé chaque jour : supprime définitivement ce qui est en corbeille depuis plus de 30 jours
export async function purgeExpiredTrash() {
  const { count } = await prisma.transaction.deleteMany({ where: { deletedAt: { not: null, lt: new Date(Date.now() - TRASH_DAYS * 86400000) } } });
  return { purged: count };
}
