import prisma from '../lib/prisma.js';
import { serialize, userId as getUserId } from '../lib/serialize.js';

const parseCSV = (content) => {
  const lines = content.split('\n').filter((line) => line.trim());
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase());
  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim());
    if (values.length < 2) continue;
    const transaction = {};
    headers.forEach((header, index) => {
      transaction[header] = values[index] || '';
    });
    transactions.push(transaction);
  }
  return transactions;
};

const normalizeTransaction = (rawTransaction) => {
  const normalized = {
    date: null,
    description: '',
    amount: 0,
    type: 'expense',
    category: null,
    reference: '',
  };

  const dateFields = ['date', 'date opération', 'date operation', 'transaction date', 'posted date'];
  for (const field of dateFields) {
    if (rawTransaction[field]) {
      const dateStr = rawTransaction[field];
      let parsedDate;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        parsedDate = new Date(`${year}-${month}-${day}`);
      } else if (dateStr.includes('-')) {
        parsedDate = new Date(dateStr);
      }
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        normalized.date = parsedDate;
        break;
      }
    }
  }

  const descFields = ['libellé', 'libelle', 'description', 'label', 'memo', 'details'];
  for (const field of descFields) {
    if (rawTransaction[field]) {
      normalized.description = rawTransaction[field];
      break;
    }
  }

  const amountFields = ['montant', 'amount', 'débit', 'debit', 'crédit', 'credit'];
  for (const field of amountFields) {
    if (rawTransaction[field]) {
      const amountStr = rawTransaction[field].replace(',', '.').replace(/[^\d.-]/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        normalized.amount = Math.abs(amount);
        if (field.includes('crédit') || field.includes('credit') || amount > 0) {
          normalized.type = 'income';
        } else {
          normalized.type = 'expense';
        }
        break;
      }
    }
  }

  const refFields = ['référence', 'reference', 'transaction id', 'id'];
  for (const field of refFields) {
    if (rawTransaction[field]) {
      normalized.reference = rawTransaction[field];
      break;
    }
  }

  return normalized;
};

export const uploadBankCSV = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { bankAccountId, csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({ message: 'Fichier CSV manquant' });
    }

    if (bankAccountId) {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: { id: bankAccountId, userId: uid },
      });
      if (!bankAccount) {
        return res.status(404).json({ message: 'Compte bancaire introuvable' });
      }
    }

    const rawTransactions = parseCSV(csvContent);
    const normalizedTransactions = rawTransactions
      .map(normalizeTransaction)
      .filter((t) => t.date && t.amount > 0);

    console.log(`✅ ${normalizedTransactions.length} transactions parsées depuis le CSV`);

    res.json({
      message: 'CSV parsé avec succès',
      preview: normalizedTransactions.slice(0, 10),
      total: normalizedTransactions.length,
      transactions: normalizedTransactions,
    });
  } catch (error) {
    console.error('❌ Erreur lors du parsing CSV:', error);
    res.status(500).json({ message: 'Erreur lors du parsing du fichier CSV' });
  }
};

export const importBankTransactions = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { bankAccountId, transactions } = req.body;

    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ message: 'Aucune transaction à importer' });
    }

    let bankAccount = null;
    if (bankAccountId) {
      bankAccount = await prisma.bankAccount.findFirst({
        where: { id: bankAccountId, userId: uid },
      });
    }

    let wallet = await prisma.wallet.findFirst({ where: { userId: uid } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: uid,
          name: 'Portefeuille principal',
          balance: 0,
        },
      });
    }

    let defaultCategory = await prisma.category.findFirst({
      where: { userId: uid, name: 'Import bancaire' },
    });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          userId: uid,
          name: 'Import bancaire',
          type: 'expense',
          color: '#64748B',
          icon: '📥',
        },
      });
    }

    const importedTransactions = [];
    let totalImported = 0;
    let totalSkipped = 0;
    let walletBalance = wallet.balance;
    let bankBalance = bankAccount?.balance ?? 0;

    for (const t of transactions) {
      try {
        const exists = await prisma.transaction.findFirst({
          where: {
            userId: uid,
            date: new Date(t.date),
            amount: t.amount,
            description: t.description,
          },
        });

        if (exists) {
          totalSkipped++;
          continue;
        }

        const newTransaction = await prisma.transaction.create({
          data: {
            userId: uid,
            walletId: wallet.id,
            bankAccountId: bankAccount?.id || null,
            categoryId: defaultCategory.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: new Date(t.date),
            notes: `Importé depuis CSV${t.reference ? ` - Ref: ${t.reference}` : ''}`,
            tags: ['import', 'csv'],
          },
        });

        if (t.type === 'income') {
          walletBalance += t.amount;
          bankBalance += t.amount;
        } else {
          walletBalance -= t.amount;
          bankBalance -= t.amount;
        }

        importedTransactions.push(serialize(newTransaction));
        totalImported++;
      } catch (error) {
        console.error('Erreur import transaction:', error);
        totalSkipped++;
      }
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: walletBalance },
    });
    if (bankAccount) {
      await prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: { balance: bankBalance },
      });
    }

    console.log(`✅ Import terminé: ${totalImported} importées, ${totalSkipped} ignorées`);

    res.json({
      message: `${totalImported} transaction(s) importée(s) avec succès`,
      imported: totalImported,
      skipped: totalSkipped,
      transactions: importedTransactions,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import des transactions' });
  }
};

export default {
  uploadBankCSV,
  importBankTransactions,
};
