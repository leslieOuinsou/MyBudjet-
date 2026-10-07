import prisma from '../lib/prisma.js';
import { serialize, userId as getUserId } from '../lib/serialize.js';
import XLSX from 'xlsx';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const exportPDF = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { startDate, endDate } = req.query;
    const where = buildTransactionWhere(uid, { startDate, endDate });

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
      orderBy: { date: 'desc' },
    });

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Liste des Transactions', 10, 20);

    if (startDate || endDate) {
      doc.setFontSize(12);
      const dateRange = `Période: ${startDate || 'Début'} - ${endDate || 'Fin'}`;
      doc.text(dateRange, 10, 30);
    }

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    doc.setFontSize(10);
    doc.text(`Total revenus: ${totalIncome.toFixed(2)}€`, 10, 40);
    doc.text(`Total dépenses: ${totalExpense.toFixed(2)}€`, 10, 48);
    doc.text(`Solde: ${balance.toFixed(2)}€`, 10, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Montant', 'Type', 'Catégorie', 'Portefeuille', 'Note']],
      body: transactions.map((t) => [
        t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
        `${t.amount.toFixed(2)}€`,
        t.type === 'income' ? 'Revenu' : 'Dépense',
        t.category?.name || '',
        t.wallet?.name || '',
        (t.note || '').substring(0, 30) + (t.note && t.note.length > 30 ? '...' : ''),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 115, 190] },
    });

    const pdf = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: "Erreur lors de l'export PDF", error: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    console.log('📊 Génération du rapport PDF...');
    const { period = 'custom', year, month, startDate, endDate } = req.query;
    const uid = getUserId(req.user);
    let start, end;
    const now = new Date();

    console.log('📋 Paramètres reçus:', { period, year, month, startDate, endDate });

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

    console.log('📅 Période calculée:', { start: start.toISOString(), end: end.toISOString() });

    const txs = await prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: start, lte: end },
      },
      include: { category: true, wallet: true },
      orderBy: { date: 'desc' },
    });

    console.log(`✅ ${txs.length} transactions trouvées`);

    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const balance = totalIncome - totalExpense;

    console.log('💰 Statistiques:', { totalIncome, totalExpense, balance });

    const byCategory = {};
    const byCategoryIncome = {};
    txs.forEach((t) => {
      if (!t.category) return;
      const key = t.category.name;
      if (t.type === 'expense') {
        byCategory[key] = (byCategory[key] || 0) + t.amount;
      } else {
        byCategoryIncome[key] = (byCategoryIncome[key] || 0) + t.amount;
      }
    });

    const byWallet = {};
    txs.forEach((t) => {
      if (!t.wallet) return;
      const key = t.wallet.name;
      byWallet[key] = (byWallet[key] || 0) + (t.type === 'income' ? t.amount : -t.amount);
    });

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Rapport Financier Détaillé', 10, 20);

    doc.setFontSize(12);
    const periodText = period === 'custom'
      ? `Période: ${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`
      : period === 'year'
        ? `Année: ${year || now.getFullYear()}`
        : `Mois: ${month || now.getMonth() + 1}/${year || now.getFullYear()}`;
    doc.text(periodText, 10, 30);

    doc.setFontSize(14);
    doc.text('Résumé Financier', 10, 45);

    doc.setFontSize(11);
    doc.text(`Total des revenus: ${totalIncome.toFixed(2)}€`, 10, 55);
    doc.text(`Total des dépenses: ${totalExpense.toFixed(2)}€`, 10, 65);
    doc.text(`Solde net: ${balance.toFixed(2)}€`, 10, 75);
    doc.text(`Nombre de transactions: ${txs.length}`, 10, 85);

    let currentY = 100;

    if (Object.keys(byCategory).length > 0 && totalExpense > 0) {
      doc.setFontSize(14);
      doc.text('Dépenses par Catégorie', 10, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Catégorie', 'Montant (€)', '% du Total']],
        body: Object.entries(byCategory)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, val]) => [
            cat,
            val.toFixed(2),
            totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) + '%' : '0%',
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [220, 53, 69] },
      });

      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        currentY = doc.lastAutoTable.finalY + 20;
      } else {
        currentY += 50;
      }
    }

    if (Object.keys(byCategoryIncome).length > 0 && totalIncome > 0) {
      doc.setFontSize(14);
      doc.text('Revenus par Catégorie', 10, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Catégorie', 'Montant (€)', '% du Total']],
        body: Object.entries(byCategoryIncome)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, val]) => [
            cat,
            val.toFixed(2),
            totalIncome > 0 ? ((val / totalIncome) * 100).toFixed(1) + '%' : '0%',
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [40, 167, 69] },
      });

      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        currentY = doc.lastAutoTable.finalY + 20;
      } else {
        currentY += 50;
      }
    }

    if (Object.keys(byWallet).length > 0) {
      doc.setFontSize(14);
      doc.text('Solde par Portefeuille', 10, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Portefeuille', 'Solde (€)']],
        body: Object.entries(byWallet)
          .sort(([, a], [, b]) => b - a)
          .map(([wallet, bal]) => [wallet, bal.toFixed(2)]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 115, 190] },
      });

      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        currentY = doc.lastAutoTable.finalY + 20;
      } else {
        currentY += 50;
      }
    }

    if (txs.length > 0) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text('Détail des Transactions', 10, currentY);
      currentY += 10;

      const transactionsToShow = txs.slice(0, 100);
      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Montant', 'Type', 'Catégorie', 'Portefeuille', 'Note']],
        body: transactionsToShow.map((t) => [
          t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
          `${(t.amount || 0).toFixed(2)}€`,
          t.type === 'income' ? 'Revenu' : 'Dépense',
          t.category?.name || 'Non catégorisé',
          t.wallet?.name || 'Non défini',
          (t.note || '').substring(0, 25) + (t.note && t.note.length > 25 ? '...' : ''),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [108, 117, 125] },
      });

      if (txs.length > 100 && doc.lastAutoTable && doc.lastAutoTable.finalY) {
        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(10);
        doc.text(`Note: Seules les 100 premières transactions sont affichées (${txs.length} au total)`, 10, finalY + 10);
      }
    } else {
      doc.setFontSize(12);
      doc.text('Aucune transaction trouvée pour cette période.', 10, currentY);
    }

    console.log('✅ PDF généré avec succès');
    const pdf = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapport-financier-${period}-${Date.now()}.pdf`);
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      message: 'Erreur lors de la génération du rapport',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
