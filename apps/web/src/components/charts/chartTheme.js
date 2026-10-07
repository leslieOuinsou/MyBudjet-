import { formatMoney } from '../../lib/format.js';

// Thème commun des graphiques. Palette catégorielle validée (écart daltonisme et contraste,
// script validate_palette) ; l'appli est en mode clair uniquement.
const LIGHT = {
  SURFACE: '#FFFFFF', GRID: '#E2E8F0', CROSSHAIR: '#CBD5E1', TIP_BORDER: '#E2E8F0',
  INCOME: '#16A34A', EXPENSE: '#DC2626', PRIMARY: '#2563EB', WARNING: '#F59E0B',
  BLUE_SOFT: '#BFDBFE', BLUE_SOFT_HOVER: '#93C5FD', OTHER: '#94A3B8',
  PRIMARY_HOVER: '#1D4ED8', WARNING_HOVER: '#D97706', CRITICAL_HOVER: '#B91C1C',
  ink: { primary: '#0F172A', secondary: '#475569', muted: '#94A3B8' },
  series: ['#2563EB', '#16A34A', '#F59E0B', '#1E3A8A', '#DC2626', '#8B5CF6', '#0EA5E9', '#EC4899'],
};
const DARK = {
  SURFACE: '#1E293B', GRID: '#334155', CROSSHAIR: '#475569', TIP_BORDER: '#334155',
  INCOME: '#22C55E', EXPENSE: '#F87171', PRIMARY: '#3B82F6', WARNING: '#FBBF24',
  BLUE_SOFT: '#1E40AF', BLUE_SOFT_HOVER: '#2563EB', OTHER: '#64748B',
  PRIMARY_HOVER: '#60A5FA', WARNING_HOVER: '#FCD34D', CRITICAL_HOVER: '#FCA5A5',
  ink: { primary: '#F8FAFC', secondary: '#CBD5E1', muted: '#94A3B8' },
  series: ['#3B82F6', '#22C55E', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA', '#38BDF8', '#F472B6'],
};

// Palette courante, modifiée sur place par setChartTheme (les graphiques lisent T au moment de dessiner)
export const T = { ...LIGHT };
export const INK = { ...LIGHT.ink };
// Catégories (camembert, barres) : couleur fixe par rang
export const SERIES = [...LIGHT.series];
// Courbes : revenus (vert), dépenses (rouge), puis solde cumulé et références
export const LINE_SERIES = [LIGHT.INCOME, LIGHT.EXPENSE, LIGHT.PRIMARY, LIGHT.WARNING];

export function setChartTheme(dark) {
  const p = dark ? DARK : LIGHT;
  Object.assign(T, p);
  Object.assign(INK, p.ink);
  SERIES.splice(0, SERIES.length, ...p.series);
  LINE_SERIES.splice(0, LINE_SERIES.length, p.INCOME, p.EXPENSE, p.PRIMARY, p.WARNING);
}

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

export const tooltipStyle = () => ({
  backgroundColor: T.SURFACE,
  titleColor: INK.primary,
  bodyColor: INK.secondary,
  borderColor: T.TIP_BORDER,
  borderWidth: 1,
  cornerRadius: 10,
  padding: 12,
  boxPadding: 6,
  usePointStyle: true,
  titleFont: { size: 13, weight: '600' },
  bodyFont: { size: 12 },
  displayColors: true,
});

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

export const axisStyle = () => ({
  x: {
    grid: { display: false },
    border: { color: T.GRID },
    ticks: { color: INK.muted, font: { size: 11 }, maxRotation: 0, autoSkip: true },
  },
  y: {
    grid: { color: T.GRID, drawTicks: false },
    border: { display: false },
    ticks: { color: INK.muted, font: { size: 11 }, padding: 8, callback: (v) => euro(v, true) },
    beginAtZero: true,
  },
});

// Message quand il n'y a rien à tracer
export const hasValues = (arrays) => arrays.some((a) => Array.isArray(a) && a.some((v) => Number(v) !== 0));
