// Charte graphique commune des PDF exportés (transactions, rapport financier, rapports).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import prisma from '../lib/prisma.js';

export const COLORS = {
  brand: [30, 115, 190],
  brandDark: [21, 90, 138],
  income: [40, 167, 69],
  expense: [220, 53, 69],
  text: [52, 58, 64],
  muted: [108, 117, 125],
  line: [222, 226, 230],
  zebra: [245, 247, 250],
  white: [255, 255, 255],
};

const SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: 'CA$', JPY: '¥' };
const MARGIN = 14;

/** Devise choisie dans Paramètres > Préférences (EUR par défaut). Les montants ne sont pas convertis. */
export async function getUserCurrency(uid) {
  try {
    const prefs = await prisma.userPreferences.findUnique({ where: { userId: uid } });
    return prefs?.appearance?.currency || 'EUR';
  } catch {
    return 'EUR';
  }
}

/** « 1 234,56 € » avec espaces classiques (les espaces insécables fines ne s'impriment pas en Helvetica). */
export function makeMoney(currency = 'EUR') {
  const symbol = SYMBOLS[currency] || currency;
  return (value) => {
    const n = Number(value) || 0;
    const [int, dec] = Math.abs(n).toFixed(2).split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${n < 0 ? '-' : ''}${grouped},${dec} ${symbol}`;
  };
}

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');

/** Crée le document, l'en-tête bandeau et retourne les outils de mise en page. */
export function createReport({ title, subtitle, userName }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const innerW = W - MARGIN * 2;

  // Bandeau d'en-tête
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, W, 34, 'F');
  doc.setFillColor(...COLORS.brandDark);
  doc.rect(0, 34, W, 1.5, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MyBudget+', MARGIN, 12);
  doc.setFontSize(20);
  doc.text(title, MARGIN, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W - MARGIN, 12, { align: 'right' });
  if (userName) doc.text(userName, W - MARGIN, 18, { align: 'right' });
  if (subtitle) doc.text(subtitle, W - MARGIN, 24, { align: 'right' });

  let y = 46;

  const api = {
    doc,
    innerW,
    get y() {
      return y;
    },
    set y(v) {
      y = v;
    },

    ensureSpace(h) {
      if (y + h > H - 20) {
        doc.addPage();
        y = 20;
      }
    },

    section(text) {
      api.ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.text);
      doc.text(text, MARGIN, y);
      doc.setDrawColor(...COLORS.brand);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, y + 2, MARGIN + 18, y + 2);
      y += 9;
    },

    /** Cartes de synthèse : [{ label, value, color }] */
    kpis(items) {
      api.ensureSpace(26);
      const gap = 4;
      const w = (innerW - gap * (items.length - 1)) / items.length;
      items.forEach((it, i) => {
        const x = MARGIN + i * (w + gap);
        doc.setFillColor(...COLORS.zebra);
        doc.setDrawColor(...COLORS.line);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, w, 21, 2, 2, 'FD');
        doc.setFillColor(...(it.color || COLORS.brand));
        doc.rect(x, y + 3, 1.2, 15, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.muted);
        doc.text(it.label, x + 5, y + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...(it.color || COLORS.text));
        doc.text(String(it.value), x + 5, y + 16);
      });
      y += 28;
    },

    paragraph(text, { color = COLORS.muted, size = 10 } = {}) {
      api.ensureSpace(10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.text(text, MARGIN, y);
      y += 10;
    },

    table({ head, body, color = COLORS.brand, columnStyles = {}, fontSize = 9 }) {
      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        margin: { left: MARGIN, right: MARGIN, bottom: 20 },
        theme: 'plain',
        styles: { fontSize, cellPadding: 2.4, textColor: COLORS.text, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
        headStyles: { fillColor: color, textColor: COLORS.white, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: COLORS.zebra },
        columnStyles,
        didParseCell: (data) => {
          const align = columnStyles[data.column.index]?.halign;
          if (align && data.section === 'head') data.cell.styles.halign = align;
        },
      });
      y = (doc.lastAutoTable?.finalY ?? y + 20) + 10;
    },

    /** Pied de page avec pagination, à appeler en dernier puis output(). */
    output() {
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i += 1) {
        doc.setPage(i);
        doc.setDrawColor(...COLORS.line);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, H - 13, W - MARGIN, H - 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.muted);
        doc.text('MyBudget+ · Document confidentiel', MARGIN, H - 8);
        doc.text(`Page ${i} / ${pages}`, W - MARGIN, H - 8, { align: 'right' });
      }
      return Buffer.from(doc.output('arraybuffer'));
    },
  };
  return api;
}

/** Couleur du texte d'un montant selon le type de transaction. */
export const typeColor = (type) => (type === 'income' ? COLORS.income : COLORS.expense);

export async function getUserName(uid) {
  try {
    const u = await prisma.user.findUnique({ where: { id: uid }, select: { name: true } });
    return u?.name || '';
  } catch {
    return '';
  }
}
