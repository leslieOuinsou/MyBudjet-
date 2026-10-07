import prisma from '../lib/prisma.js';
import { serialize, userId as getUserId } from '../lib/serialize.js';
import XLSX from 'xlsx';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createReport, COLORS, makeMoney, fmtDate, getUserCurrency, getUserName } from '../utils/pdfStyle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildTransactionWhere(uid, { startDate, endDate }) {
  const where = { userId: uid };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  // Note: schema Prisma Transaction n'a pas de champ `status` — filtre pending ignoré
  return where;
}

export const exportCSV = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { startDate, endDate } = req.query;
    const where = buildTransactionWhere(uid, { startDate, endDate });

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
    });

    const fields = ['amount', 'type', 'category', 'wallet', 'date', 'note'];
    const parser = new Parser({ fields });

    const csvData = transactions.map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category?.name || '',
      wallet: t.wallet?.name || '',
      date: t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
      note: t.note || '',
    }));

    const csv = parser.parse(csvData);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({ message: "Erreur lors de l'export CSV", error: error.message });
  }
};

export const exportExcel = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { startDate, endDate } = req.query;
    const where = buildTransactionWhere(uid, { startDate, endDate });

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
    });

    const data = transactions.map((t) => ({
      Montant: t.amount,
      Type: t.type === 'income' ? 'Revenu' : 'Dépense',
      Catégorie: t.category?.name || '',
      Portefeuille: t.wallet?.name || '',
      Date: t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
      Note: t.note || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    const filename = `transactions_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../../tmp/', filename);

    const tmpDir = path.join(__dirname, '../../tmp/');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    XLSX.writeFile(wb, filePath);

    res.download(filePath, 'transactions.xlsx', (err) => {
      if (err) {
        console.error('Erreur téléchargement Excel:', err);
      }
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ message: "Erreur lors de l'export Excel", error: error.message });
  }
};

export const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }

    const uid = getUserId(req.user);
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let data = [];
    let imported = 0;
    let errors = 0;
    let duplicates = 0;
    let details = [];

    let fileContent;
    let filePath = null;

    if (req.file.buffer) {
      fileContent = req.file.buffer.toString('utf8');
    } else if (req.file.path) {
      filePath = req.file.path;
      fileContent = fs.readFileSync(req.file.path, 'utf8');
    } else {
      return res.status(400).json({ message: 'Impossible de lire le fichier' });
    }

    try {
      if (ext === 'csv') {
        const content = fileContent;

        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rows = content.split(/\r?\n/).filter((row) => row.trim());
        if (rows.length < 2) {
          throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
        }

        const headers = parseCSVLine(rows[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());

        for (let i = 1; i < rows.length; i++) {
          const values = parseCSVLine(rows[i]).map((v) => v.replace(/^"|"$/g, '').trim());

          if (values.length > 0 && values.some((v) => v !== '')) {
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx] || '';
            });
            data.push(obj);
          }
        }

        if (data.length === 0) {
          throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
        }
      } else if (ext === 'xlsx' || ext === 'xls') {
        let workbook;
        if (req.file.buffer) {
          workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        } else {
          workbook = XLSX.readFile(req.file.path);
        }
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);

        data = data.map((row) => {
          const normalizedRow = {};
          Object.keys(row).forEach((key) => {
            normalizedRow[key.toLowerCase()] = row[key];
          });
          return normalizedRow;
        });
      } else {
        return res.status(400).json({ message: 'Format de fichier non supporté. Utilisez CSV ou Excel.' });
      }
    } catch (readError) {
      return res.status(400).json({ message: `Erreur lors de la lecture du fichier: ${readError.message}` });
    }

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];

        const amountStr = (row.montant || row.amount || '').toString().replace(/[^\d.,-]/g, '').replace(',', '.');
        const amount = parseFloat(amountStr);
        const type = (row.type || row.type_transaction || row['type transaction'] || '').toString().toLowerCase().trim();
        const note = (row.note || row.description || row.libelle || row.libellé || row.commentaire || '').toString().trim();
        const dateStr = row.date || row.date_transaction || row['date transaction'] || new Date().toISOString();

        if (isNaN(amount) || amount === 0) {
          errors++;
          details.push(`Ligne ${i + 2}: Montant invalide ou manquant (valeur: "${row.montant || row.amount}")`);
          continue;
        }

        const validTypes = ['income', 'expense', 'revenu', 'depense', 'revenue', 'dépense', 'entrée', 'sortie', 'in', 'out'];
        if (!type || !validTypes.some((t) => type.includes(t))) {
          errors++;
          details.push(`Ligne ${i + 2}: Type de transaction invalide "${type}" (doit être: income/expense/revenu/depense)`);
          continue;
        }

        let normalizedType;
        if (type.includes('revenu') || type.includes('revenue') || type.includes('entrée') || type.includes('in') || type === 'income') {
          normalizedType = 'income';
        } else if (type.includes('depense') || type.includes('dépense') || type.includes('sortie') || type.includes('out') || type === 'expense') {
          normalizedType = 'expense';
        } else {
          normalizedType = type;
        }

        let transactionDate;
        try {
          let dateToParse = dateStr.toString().trim();

          if (dateToParse.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
            const parts = dateToParse.split(/[\/\-]/);
            dateToParse = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }

          transactionDate = new Date(dateToParse);
          if (isNaN(transactionDate.getTime())) {
            const parsed = Date.parse(dateToParse);
            if (!isNaN(parsed)) {
              transactionDate = new Date(parsed);
            } else {
              transactionDate = new Date();
              details.push(`Ligne ${i + 2}: Date invalide "${dateStr}", date du jour utilisée`);
            }
          }
        } catch (dateError) {
          transactionDate = new Date();
          details.push(`Ligne ${i + 2}: Erreur parsing date "${dateStr}", date du jour utilisée`);
        }

        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: uid,
            amount,
            type: normalizedType,
            date: {
              gte: new Date(transactionDate.getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(transactionDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        if (existingTransaction) {
          duplicates++;
          details.push(`Ligne ${i + 2}: Transaction en doublon ignorée`);
          continue;
        }

        await prisma.transaction.create({
          data: {
            amount: Math.abs(amount),
            type: normalizedType,
            userId: uid,
            date: transactionDate,
            description: note || 'Transaction importée',
            note: note || null,
            categoryId: null,
            walletId: null,
          },
        });

        imported++;
      } catch (createError) {
        errors++;
        details.push(`Ligne ${i + 2}: Erreur lors de la création: ${createError.message}`);
      }
    }

    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.warn('⚠️ Impossible de supprimer le fichier temporaire:', unlinkError.message);
      }
    }

    res.json({
      message: `Import terminé: ${imported} transactions importées, ${errors} erreurs, ${duplicates} doublons`,
      imported,
      errors,
      duplicates,
      total: data.length,
      details: details.slice(0, 10),
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression du fichier temporaire:', unlinkError);
      }
    }

    console.error('❌ Erreur lors de l\'import:', error);
    console.error('   Stack:', error.stack);

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'Le fichier est trop volumineux (maximum 10MB)',
          error: error.message,
        });
      }
      return res.status(400).json({
        message: "Erreur lors de l'upload du fichier",
        error: error.message,
      });
    }

    res.status(500).json({
      message: error.message || "Erreur interne lors de l'import",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur',
    });
  }
};

const sum = (list, type) => list.filter((t) => t.type === type).reduce((s, t) => s + (t.amount || 0), 0);
const noteShort = (n, max) => (n ? (n.length > max ? `${n.substring(0, max)}…` : n) : '');

function groupTotals(txs, type, pick) {
  const out = {};
  txs.forEach((t) => {
    const key = pick(t);
    if (!key || (type && t.type !== type)) return;
    out[key] = (out[key] || 0) + (t.amount || 0);
  });
  return Object.entries(out).sort(([, a], [, b]) => b - a);
}

const sendPdf = (res, filename, buffer) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(buffer);
};

export const exportPDF = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { startDate, endDate } = req.query;
    const where = buildTransactionWhere(uid, { startDate, endDate });

    const [transactions, currency, userName] = await Promise.all([
      prisma.transaction.findMany({ where, include: { category: true, wallet: true }, orderBy: { date: 'desc' } }),
      getUserCurrency(uid),
      getUserName(uid),
    ]);
    const money = makeMoney(currency);

    const totalIncome = sum(transactions, 'income');
    const totalExpense = sum(transactions, 'expense');
    const balance = totalIncome - totalExpense;

    const subtitle = startDate || endDate ? `Du ${startDate || 'début'} au ${endDate || 'jour'}` : 'Toutes les périodes';
    const report = createReport({ title: 'Liste des transactions', subtitle, userName });

    report.kpis([
      { label: 'Revenus', value: money(totalIncome), color: COLORS.income },
      { label: 'Dépenses', value: money(totalExpense), color: COLORS.expense },
      { label: 'Solde', value: money(balance), color: balance >= 0 ? COLORS.brand : COLORS.expense },
    ]);

    report.section(`Transactions (${transactions.length})`);
    if (transactions.length === 0) {
      report.paragraph('Aucune transaction sur cette période.');
    } else {
      report.table({
        head: ['Date', 'Catégorie', 'Portefeuille', 'Note', 'Montant'],
        body: transactions.map((t) => [
          fmtDate(t.date),
          t.category?.name || 'Non catégorisé',
          t.wallet?.name || '',
          noteShort(t.note, 32),
          `${t.type === 'income' ? '+' : '-'} ${money(t.amount)}`,
        ]),
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
        fontSize: 8.5,
      });
    }

    sendPdf(res, 'transactions.pdf', report.output());
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: "Erreur lors de l'export PDF", error: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { period = 'custom', year, month, startDate, endDate } = req.query;
    const uid = getUserId(req.user);
    let start, end;
    const now = new Date();

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      const y = year || now.getFullYear();
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59);
    } else {
      const y = year || now.getFullYear();
      const m = month ? parseInt(month, 10) - 1 : now.getMonth();
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 0, 23, 59, 59);
    }

    const [txs, currency, userName] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: uid, date: { gte: start, lte: end } },
        include: { category: true, wallet: true },
        orderBy: { date: 'desc' },
      }),
      getUserCurrency(uid),
      getUserName(uid),
    ]);
    const money = makeMoney(currency);

    const totalIncome = sum(txs, 'income');
    const totalExpense = sum(txs, 'expense');
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const periodText = period === 'year'
      ? `Année ${year || now.getFullYear()}`
      : `Du ${fmtDate(start)} au ${fmtDate(end)}`;
    const report = createReport({ title: 'Rapport financier', subtitle: periodText, userName });

    report.kpis([
      { label: 'Revenus', value: money(totalIncome), color: COLORS.income },
      { label: 'Dépenses', value: money(totalExpense), color: COLORS.expense },
      { label: 'Solde net', value: money(balance), color: balance >= 0 ? COLORS.brand : COLORS.expense },
    ]);
    report.paragraph(`${txs.length} transaction${txs.length > 1 ? 's' : ''} · Taux d'épargne : ${savingsRate.toFixed(1)} %`);

    const expenseByCat = groupTotals(txs, 'expense', (t) => t.category?.name);
    if (expenseByCat.length > 0 && totalExpense > 0) {
      report.section('Dépenses par catégorie');
      report.table({
        head: ['Catégorie', 'Montant', '% des dépenses'],
        body: expenseByCat.map(([cat, val]) => [cat, money(val), `${((val / totalExpense) * 100).toFixed(1)} %`]),
        color: COLORS.expense,
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });
    }

    const incomeByCat = groupTotals(txs, 'income', (t) => t.category?.name);
    if (incomeByCat.length > 0 && totalIncome > 0) {
      report.section('Revenus par catégorie');
      report.table({
        head: ['Catégorie', 'Montant', '% des revenus'],
        body: incomeByCat.map(([cat, val]) => [cat, money(val), `${((val / totalIncome) * 100).toFixed(1)} %`]),
        color: COLORS.income,
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });
    }

    const byWallet = {};
    txs.forEach((t) => {
      if (!t.wallet) return;
      byWallet[t.wallet.name] = (byWallet[t.wallet.name] || 0) + (t.type === 'income' ? t.amount : -t.amount);
    });
    const wallets = Object.entries(byWallet).sort(([, a], [, b]) => b - a);
    if (wallets.length > 0) {
      report.section('Mouvement par portefeuille');
      report.table({
        head: ['Portefeuille', 'Variation'],
        body: wallets.map(([name, bal]) => [name, money(bal)]),
        columnStyles: { 1: { halign: 'right' } },
      });
    }

    report.section('Détail des transactions');
    if (txs.length === 0) {
      report.paragraph('Aucune transaction trouvée pour cette période.');
    } else {
      report.table({
        head: ['Date', 'Catégorie', 'Portefeuille', 'Note', 'Montant'],
        body: txs.slice(0, 100).map((t) => [
          fmtDate(t.date),
          t.category?.name || 'Non catégorisé',
          t.wallet?.name || 'Non défini',
          noteShort(t.note, 28),
          `${t.type === 'income' ? '+' : '-'} ${money(t.amount)}`,
        ]),
        color: COLORS.muted,
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
        fontSize: 8.5,
      });
      if (txs.length > 100) {
        report.paragraph(`Seules les 100 premières transactions sont affichées (${txs.length} au total).`, { size: 9 });
      }
    }

    sendPdf(res, `rapport-financier-${period}-${Date.now()}.pdf`, report.output());
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    res.status(500).json({
      message: 'Erreur lors de la génération du rapport',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur',
    });
  }
};
