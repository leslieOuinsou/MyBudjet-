import { formatMoney } from '../../lib/format.js';

// Thème commun des graphiques. Palette catégorielle validée (écart daltonisme et contraste,
// script validate_palette) ; l'appli est en mode clair uniquement.
export const SURFACE = '#FFFFFF';
export const INK = { primary: '#0F172A', secondary: '#475569', muted: '#94A3B8' };
export const GRID = '#E2E8F0';

// Charte MyBudget+ : bleu = principal, vert = revenus / positif, rouge = dépenses / dépassement, orange = alerte
export const INCOME = '#16A34A';
export const EXPENSE = '#DC2626';
export const PRIMARY = '#2563EB';
export const WARNING = '#F59E0B';

// Courbes : revenus, dépenses, puis solde cumulé et références
export const LINE_SERIES = [INCOME, EXPENSE, PRIMARY, WARNING];

// Catégories (camembert, barres) : couleur fixe par rang, les 5 premières viennent de la charte
export const SERIES = ['#2563EB', '#16A34A', '#F59E0B', '#1E3A8A', '#DC2626', '#8B5CF6', '#0EA5E9', '#EC4899'];
export const OTHER = '#94A3B8'; // « Autres » : gris neutre, jamais un 9e hue
export const BLUE_SOFT = '#BFDBFE'; // valeur de référence (budget alloué)
export const CRITICAL = EXPENSE; // statut « dépassé » (toujours accompagné d'un libellé)

export const euro = (value, compact = false) => formatMoney(value, { compact });

export const hexAlpha = (hex, alpha) =>
  `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

// Dégradé vertical sous une courbe (Chart.js n'a pas de zone de tracé au tout premier rendu)
export const areaGradient = (color, top = 0.28) => (context) => {
  const { chart } = context;
  if (!chart.chartArea) return hexAlpha(color, 0.12);
  const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
  gradient.addColorStop(0, hexAlpha(color, top));
  gradient.addColorStop(1, hexAlpha(color, 0));
  return gradient;
};

export const tooltipStyle = {
  backgroundColor: SURFACE,
  titleColor: INK.primary,
  bodyColor: INK.secondary,
  borderColor: '#E2E8F0',
  borderWidth: 1,
  cornerRadius: 10,
  padding: 12,
  boxPadding: 6,
  usePointStyle: true,
  titleFont: { size: 13, weight: '600' },
  bodyFont: { size: 12 },
  displayColors: true,
};

export const legendStyle = (pointStyle = 'circle') => ({
  position: 'top',
  align: 'end',
  labels: {
    color: INK.secondary,
    font: { size: 12, weight: '500' },
    usePointStyle: true,
    pointStyle,
    boxWidth: 8,
    boxHeight: 8,
    padding: 16,
  },
});

export const axisStyle = {
  x: {
    grid: { display: false },
    border: { color: GRID },
    ticks: { color: INK.muted, font: { size: 11 }, maxRotation: 0, autoSkip: true },
  },
  y: {
    grid: { color: GRID, drawTicks: false },
    border: { display: false },
    ticks: { color: INK.muted, font: { size: 11 }, padding: 8, callback: (v) => euro(v, true) },
    beginAtZero: true,
  },
};

// Message quand il n'y a rien à tracer
export const hasValues = (arrays) => arrays.some((a) => Array.isArray(a) && a.some((v) => Number(v) !== 0));
