import Transaction from '../models/transaction.js';
import XLSX from 'xlsx';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate, includePending } = req.query;
    let filter = { user: req.user._id };
    
    // Ajouter le filtre de dates si fourni
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Filtrer les transactions en attente si nécessaire
    if (includePending === 'false') {
      filter.status = { $ne: 'pending' };
    }
    
    const transactions = await Transaction.find(filter).populate('category wallet');
    
    const fields = ['amount', 'type', 'category', 'wallet', 'date', 'note'];
    const parser = new Parser({ fields });
    
    const csvData = transactions.map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.category?.name || '',
      wallet: t.wallet?.name || '',
      date: t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
      note: t.note || ''
    }));
    
    const csv = parser.parse(csvData);
    
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('transactions.csv');
    res.send(csv);
    
  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export CSV', error: error.message });
  }
};

export const exportExcel = async (req, res) => {
  try {
    const { startDate, endDate, includePending } = req.query;
    let filter = { user: req.user._id };
    
    // Ajouter le filtre de dates si fourni
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Filtrer les transactions en attente si nécessaire
    if (includePending === 'false') {
      filter.status = { $ne: 'pending' };
    }
    
    const transactions = await Transaction.find(filter).populate('category wallet');
    
    const data = transactions.map(t => ({
      Montant: t.amount,
      Type: t.type === 'income' ? 'Revenu' : 'Dépense',
      Catégorie: t.category?.name || '',
      Portefeuille: t.wallet?.name || '',
      Date: t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
      Note: t.note || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    const filename = `transactions_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../../tmp/', filename);
    
    // S'assurer que le dossier existe
    const tmpDir = path.join(__dirname, '../../tmp/');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    XLSX.writeFile(wb, filePath);
    
    res.download(filePath, 'transactions.xlsx', (err) => {
      if (err) {
        console.error('Erreur téléchargement Excel:', err);
      }
      // Nettoyage du fichier temporaire
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel', error: error.message });
  }
};

export const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let data = [];
    let imported = 0;
    let errors = 0;
    let duplicates = 0;
    let details = [];

    // Lecture du fichier selon le format
    try {
      if (ext === 'csv') {
        const content = fs.readFileSync(req.file.path, 'utf8');
        const rows = content.split('\n').filter(row => row.trim());
        if (rows.length < 2) {
          throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
        }
        
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',');
          if (values.length === headers.length) {
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx]?.trim();
            });
            data.push(obj);
          }
        }
      } else if (ext === 'xlsx' || ext === 'xls') {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
        
        // Normaliser les clés en minuscules
        data = data.map(row => {
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
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

    // Validation et import des données
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Validation des champs requis et mapping
        const amount = parseFloat(row.montant || row.amount);
        const type = (row.type || row.type_transaction || '').toLowerCase();
        const note = row.note || row.description || row.libelle || '';
        const dateStr = row.date || row.date_transaction || new Date().toISOString();
        
        if (isNaN(amount) || amount === 0) {
          errors++;
          details.push(`Ligne ${i + 2}: Montant invalide ou manquant`);
          continue;
        }
        
        if (!type || !['income', 'expense', 'revenu', 'depense'].includes(type)) {
          errors++;
          details.push(`Ligne ${i + 2}: Type de transaction invalide (doit être income/expense ou revenu/depense)`);
          continue;
        }

        // Normaliser le type
        const normalizedType = type === 'revenu' ? 'income' : (type === 'depense' ? 'expense' : type);
        
        // Parser la date
        let transactionDate;
        try {
          transactionDate = new Date(dateStr);
          if (isNaN(transactionDate.getTime())) {
            transactionDate = new Date();
          }
        } catch {
          transactionDate = new Date();
        }

        // Vérifier les doublons (même montant, type et date)
        const existingTransaction = await Transaction.findOne({
          user: req.user._id,
          amount: amount,
          type: normalizedType,
          date: {
            $gte: new Date(transactionDate.getTime() - 24 * 60 * 60 * 1000),
            $lte: new Date(transactionDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingTransaction) {
          duplicates++;
          details.push(`Ligne ${i + 2}: Transaction en doublon ignorée`);
          continue;
        }

        // Créer la transaction
        await Transaction.create({
          amount: Math.abs(amount), // S'assurer que le montant est positif
          type: normalizedType,
          user: req.user._id,
          date: transactionDate,
          note: note,
          // Catégorie et portefeuille par défaut - peuvent être mis à jour manuellement
          category: null,
          wallet: null
        });

        imported++;
        
      } catch (createError) {
        errors++;
        details.push(`Ligne ${i + 2}: Erreur lors de la création: ${createError.message}`);
      }
    }

    // Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);

    // Réponse avec statistiques détaillées
    res.json({ 
      message: `Import terminé: ${imported} transactions importées, ${errors} erreurs, ${duplicates} doublons`,
      imported,
      errors,
      duplicates,
      total: data.length,
      details: details.slice(0, 10) // Limiter les détails pour éviter une réponse trop lourde
    });

  } catch (error) {
    // Nettoyage en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Erreur lors de l\'import:', error);
    res.status(500).json({ 
      message: 'Erreur interne lors de l\'import',
      error: error.message
    });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const { startDate, endDate, includePending } = req.query;
    let filter = { user: req.user._id };
    
    // Ajouter le filtre de dates si fourni
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Filtrer les transactions en attente si nécessaire
    if (includePending === 'false') {
      filter.status = { $ne: 'pending' };
    }
    
    const transactions = await Transaction.find(filter)
      .populate('category wallet')
      .sort({ date: -1 });
    
    const doc = new jsPDF();
    
    // En-tête du document
    doc.setFontSize(16);
    doc.text('Liste des Transactions', 10, 20);
    
    if (startDate || endDate) {
      doc.setFontSize(12);
      const dateRange = `Période: ${startDate || 'Début'} - ${endDate || 'Fin'}`;
      doc.text(dateRange, 10, 30);
    }
    
    // Résumé
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    doc.setFontSize(10);
    doc.text(`Total revenus: ${totalIncome.toFixed(2)}€`, 10, 40);
    doc.text(`Total dépenses: ${totalExpense.toFixed(2)}€`, 10, 48);
    doc.text(`Solde: ${balance.toFixed(2)}€`, 10, 56);
    
    // Tableau des transactions
    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Montant', 'Type', 'Catégorie', 'Portefeuille', 'Note']],
      body: transactions.map(t => [
        t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
        `${t.amount.toFixed(2)}€`,
        t.type === 'income' ? 'Revenu' : 'Dépense',
        t.category?.name || '',
        t.wallet?.name || '',
        (t.note || '').substring(0, 30) + (t.note && t.note.length > 30 ? '...' : '')
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 115, 190] }
    });
    
    const pdf = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
    res.send(Buffer.from(pdf));
    
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF', error: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { period = 'custom', year, month, startDate, endDate } = req.query;
    const user = req.user._id;
    let start, end;
    const now = new Date();
    
    // Déterminer la période
    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (period === 'year') {
      const y = year || now.getFullYear();
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59);
    } else {
      const y = year || now.getFullYear();
      const m = month ? parseInt(month) - 1 : now.getMonth();
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 0, 23, 59, 59);
    }
    
    const txs = await Transaction.find({ 
      user, 
      date: { $gte: start, $lte: end } 
    }).populate('category wallet').sort({ date: -1 });
    
    // Calculs statistiques
    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    // Regroupement par catégorie
    const byCategory = {};
    const byCategoryIncome = {};
    txs.forEach(t => {
      if (!t.category) return;
      const key = t.category.name;
      if (t.type === 'expense') {
        byCategory[key] = (byCategory[key] || 0) + t.amount;
      } else {
        byCategoryIncome[key] = (byCategoryIncome[key] || 0) + t.amount;
      }
    });
    
    // Regroupement par portefeuille
    const byWallet = {};
    txs.forEach(t => {
      if (!t.wallet) return;
      const key = t.wallet.name;
      byWallet[key] = (byWallet[key] || 0) + (t.type === 'income' ? t.amount : -t.amount);
    });
    
    // Génération PDF
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(18);
    doc.text('Rapport Financier Détaillé', 10, 20);
    
    doc.setFontSize(12);
    const periodText = period === 'custom' 
      ? `Période: ${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`
      : period === 'year' 
        ? `Année: ${year || now.getFullYear()}`
        : `Mois: ${month || now.getMonth() + 1}/${year || now.getFullYear()}`;
    doc.text(periodText, 10, 30);
    
    // Résumé financier
    doc.setFontSize(14);
    doc.text('Résumé Financier', 10, 45);
    
    doc.setFontSize(11);
    doc.text(`Total des revenus: ${totalIncome.toFixed(2)}€`, 10, 55);
    doc.text(`Total des dépenses: ${totalExpense.toFixed(2)}€`, 10, 65);
    doc.text(`Solde net: ${balance.toFixed(2)}€`, 10, 75);
    doc.text(`Nombre de transactions: ${txs.length}`, 10, 85);
    
    let currentY = 100;
    
    // Dépenses par catégorie
    if (Object.keys(byCategory).length > 0) {
      doc.setFontSize(14);
      doc.text('Dépenses par Catégorie', 10, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Catégorie', 'Montant (€)', '% du Total']],
        body: Object.entries(byCategory)
          .sort(([,a], [,b]) => b - a)
          .map(([cat, val]) => [
            cat, 
            val.toFixed(2), 
            ((val / totalExpense) * 100).toFixed(1) + '%'
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [220, 53, 69] }
      });
      
      currentY = doc.lastAutoTable.finalY + 20;
    }
    
    // Revenus par catégorie
    if (Object.keys(byCategoryIncome).length > 0) {
      doc.setFontSize(14);
      doc.text('Revenus par Catégorie', 10, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Catégorie', 'Montant (€)', '% du Total']],
        body: Object.entries(byCategoryIncome)
          .sort(([,a], [,b]) => b - a)
          .map(([cat, val]) => [
            cat, 
            val.toFixed(2), 
            ((val / totalIncome) * 100).toFixed(1) + '%'
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [40, 167, 69] }
      });
      
      currentY = doc.lastAutoTable.finalY + 20;
    }
    
    // Solde par portefeuille
    if (Object.keys(byWallet).length > 0) {
      doc.setFontSize(14);
      doc.text('Solde par Portefeuille', 10, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Portefeuille', 'Solde (€)']],
        body: Object.entries(byWallet)
          .sort(([,a], [,b]) => b - a)
          .map(([wallet, balance]) => [
            wallet, 
            balance.toFixed(2)
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 115, 190] }
      });
      
      currentY = doc.lastAutoTable.finalY + 20;
    }
    
    // Nouvelle page pour le détail des transactions si nécessaire
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Détail des transactions
    doc.setFontSize(14);
    doc.text('Détail des Transactions', 10, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Montant', 'Type', 'Catégorie', 'Portefeuille', 'Note']],
      body: txs.slice(0, 100).map(t => [ // Limiter à 100 transactions pour éviter un PDF trop lourd
        t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
        `${t.amount.toFixed(2)}€`,
        t.type === 'income' ? 'Revenu' : 'Dépense',
        t.category?.name || 'Non catégorisé',
        t.wallet?.name || 'Non défini',
        (t.note || '').substring(0, 25) + (t.note && t.note.length > 25 ? '...' : '')
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 117, 125] }
    });
    
    if (txs.length > 100) {
      const finalY = doc.lastAutoTable.finalY;
      doc.setFontSize(10);
      doc.text(`Note: Seules les 100 premières transactions sont affichées (${txs.length} au total)`, 10, finalY + 10);
    }
    
    const pdf = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport-financier-detaille.pdf');
    res.send(Buffer.from(pdf));
    
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport', error: error.message });
  }
};
