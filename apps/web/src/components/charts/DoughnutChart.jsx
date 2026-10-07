import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext.jsx';
import { T, SERIES, INK, setChartTheme, tooltipStyle, euro } from './chartTheme.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MAX_SLICES = SERIES.length - 1; // 7 couleurs + « Autres » ; jamais de 9e teinte inventée

// Regroupe les plus petites parts dans « Autres » et trie par montant décroissant
const prepare = (labels = [], values = []) => {
  const rows = labels.map((label, i) => ({ label, value: Number(values[i]) || 0 })).filter((r) => r.value > 0);
  rows.sort((a, b) => b.value - a.value);
  if (rows.length <= SERIES.length) return { rows, colors: rows.map((_, i) => SERIES[i]) };
  const head = rows.slice(0, MAX_SLICES);
  const rest = rows.slice(MAX_SLICES).reduce((s, r) => s + r.value, 0);
  return { rows: [...head, { label: 'Autres', value: rest }], colors: [...SERIES.slice(0, MAX_SLICES), T.OTHER] };
};

// Total affiché au centre du donut
const centerText = {
  id: 'centerText',
  afterDraw(chart) {
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const meta = chart.getDatasetMeta(0).data[0];
    if (!meta) return;
    const { ctx } = chart;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK.muted;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText('Total', meta.x, meta.y - 12);
    ctx.fillStyle = INK.primary;
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText(euro(total, true), meta.x, meta.y + 10);
    ctx.restore();
  },
};

export default function DoughnutChart({ data, title }) {
  const { isDarkMode } = useTheme();
  setChartTheme(isDarkMode);
  const { rows, colors } = prepare(data?.labels, data?.values);
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (rows.length === 0) {
    return <div className="h-64 w-full flex items-center justify-center text-sm text-gray-500 dark:text-[#94A3B8]">Aucune dépense sur cette période.</div>;
  }

  const chartData = {
    labels: rows.map((r) => r.label),
    datasets: [{
      data: rows.map((r) => r.value),
      backgroundColor: colors,
      borderColor: T.SURFACE,
      borderWidth: 3, // l'écart entre parts est la couleur du fond
      hoverOffset: 6,
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    // Légende sous le graphique sur petit écran
    onResize: (chart, size) => {
      chart.options.plugins.legend.position = size.width < 420 ? 'bottom' : 'right';
    },
    animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
    plugins: {
      title: { display: !!title, text: title, color: INK.primary, font: { size: 15, weight: '600' } },
      legend: {
        position: 'right',
        labels: {
          color: INK.secondary,
          font: { size: 12, weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 12,
          generateLabels: (chart) =>
            chart.data.labels.map((label, i) => ({
              text: `${label} · ${Math.round((chart.data.datasets[0].data[i] / total) * 100)} %`,
              fillStyle: colors[i],
              strokeStyle: colors[i],
              fontColor: INK.secondary,
              pointStyle: 'circle',
              index: i,
              hidden: !chart.getDataVisibility(i),
            })),
        },
      },
      tooltip: {
        ...tooltipStyle(),
        callbacks: {
          label: (c) => ` ${c.label} : ${euro(c.parsed)} (${Math.round((c.parsed / total) * 100)} %)`,
        },
      },
    },
  };

  return (
    <div className="relative h-64 w-full">
      <Doughnut data={chartData} options={options} plugins={[centerText]} />
    </div>
  );
}
