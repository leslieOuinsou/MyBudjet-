import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SERIES, SURFACE, INK, areaGradient, axisStyle, legendStyle, tooltipStyle, euro, hasValues } from './chartTheme.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const [INCOME, EXPENSE] = SERIES;

// Trait vertical qui suit la souris : on lit les deux valeurs d'un même mois d'un coup d'œil
const crosshair = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    const active = chart.getActiveElements();
    if (!active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#C9C8C2';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

const series = (label, values, color) => ({
  label,
  data: values || [],
  borderColor: color,
  backgroundColor: areaGradient(color, 0.16),
  borderWidth: 2,
  fill: true,
  tension: 0.35,
  pointRadius: 0,
  pointHoverRadius: 6,
  pointHoverBorderWidth: 2,
  pointBackgroundColor: color,
  pointHoverBackgroundColor: color,
  pointBorderColor: SURFACE,
  pointHoverBorderColor: SURFACE,
});

export default function LineChart({ data, title }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [series('Revenus', data?.income, INCOME), series('Dépenses', data?.expense, EXPENSE)],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: legendStyle('circle'),
      title: { display: !!title, text: title, color: INK.primary, font: { size: 15, weight: '600' } },
      tooltip: {
        ...tooltipStyle,
        callbacks: { label: (c) => ` ${c.dataset.label} : ${euro(c.parsed.y)}` },
      },
    },
    scales: axisStyle,
  };

  if (!hasValues([data?.income, data?.expense])) {
    return <div className="h-64 w-full flex items-center justify-center text-sm text-gray-500">Aucune donnée sur cette période.</div>;
  }

  return (
    <div className="relative h-64 w-full">
      <Line data={chartData} options={options} plugins={[crosshair]} />
    </div>
  );
}
