import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SERIES, BLUE_SOFT, CRITICAL, INK, axisStyle, legendStyle, tooltipStyle, euro, hasValues } from './chartTheme.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ data, title }) {
  const budgets = data?.budget || [];
  const spent = data?.spent || [];

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Budget alloué',
        data: budgets,
        backgroundColor: BLUE_SOFT,
        hoverBackgroundColor: '#6DA7EC',
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: 'bottom',
        maxBarThickness: 26,
      },
      {
        label: 'Dépenses réelles',
        data: spent,
        // Dépassement : couleur de statut, doublée d'un libellé dans l'infobulle
        backgroundColor: spent.map((s, i) => (s > (budgets[i] || 0) ? CRITICAL : SERIES[0])),
        hoverBackgroundColor: spent.map((s, i) => (s > (budgets[i] || 0) ? '#B92F2F' : '#1F66BD')),
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: 'bottom',
        maxBarThickness: 26,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 700, easing: 'easeOutQuart' },
    categoryPercentage: 0.7,
    barPercentage: 0.9,
    datasets: { bar: { borderColor: '#FFFFFF', borderWidth: { top: 0, left: 1, right: 1, bottom: 0 } } },
    plugins: {
      legend: {
        ...legendStyle('rectRounded'),
        onClick: () => {}, // légende informative : le 3e repère n'est pas une série
        labels: {
          ...legendStyle('rectRounded').labels,
          generateLabels: () => [
            { text: 'Budget alloué', fillStyle: BLUE_SOFT, strokeStyle: BLUE_SOFT, pointStyle: 'rectRounded', fontColor: INK.secondary },
            { text: 'Dépenses réelles', fillStyle: SERIES[0], strokeStyle: SERIES[0], pointStyle: 'rectRounded', fontColor: INK.secondary },
            { text: 'Budget dépassé', fillStyle: CRITICAL, strokeStyle: CRITICAL, pointStyle: 'rectRounded', fontColor: INK.secondary },
          ],
        },
      },
      title: { display: !!title, text: title, color: INK.primary, font: { size: 15, weight: '600' } },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (c) => ` ${c.dataset.label} : ${euro(c.parsed.y)}`,
          afterLabel: (c) => {
            if (c.datasetIndex !== 1) return '';
            const budget = budgets[c.dataIndex] || 0;
            if (budget <= 0) return '';
            const pct = Math.round((c.parsed.y / budget) * 100);
            return c.parsed.y > budget ? `  ⚠ Dépassé (${pct} % du budget)` : `  ✓ Respecté (${pct} % du budget)`;
          },
        },
      },
    },
    scales: axisStyle,
  };

  if (!hasValues([budgets, spent])) {
    return <div className="h-64 w-full flex items-center justify-center text-sm text-gray-500">Aucun budget à comparer.</div>;
  }

  return (
    <div className="relative h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
