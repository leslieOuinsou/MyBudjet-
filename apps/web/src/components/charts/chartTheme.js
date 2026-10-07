import { formatMoney } from '../../lib/format.js';

// Thème commun des graphiques. Palette catégorielle validée (écart daltonisme et contraste,
// script validate_palette) ; l'appli est en mode clair uniquement.
export const SURFACE = '#FFFFFF';
export const INK = { primary: '#22292F', secondary: '#52514E', muted: '#8A8983' };
export const GRID = '#ECEBE8';

// Ordre fixe : la couleur suit l'entité, jamais le rang.
export const SERIES = ['#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#4A3AA7', '#E34948'];
export const OTHER = '#B6B5AF'; // « Autres » : gris neutre, jamais un 9e hue
export const BLUE_SOFT = '#86B6EF'; // palette séquentielle bleue, pour la valeur de référence
export const CRITICAL = '#D03B3B'; // statut « dépassé » (toujours accompagné d'un libellé)

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
  borderColor: '#DAD9D4',
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
