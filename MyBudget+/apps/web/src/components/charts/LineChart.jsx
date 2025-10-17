import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ data, title, isDarkMode = false }) {
  // Couleurs adaptées au thème
  const colors = {
    light: {
      income: '#28A745',
      expense: '#DC3545',
      grid: '#F5F7FA',
      text: '#343A40',
      background: '#FFFFFF'
    },
    dark: {
      income: '#4CAF50',
      expense: '#F44336',
      grid: '#404040',
      text: '#e4e4e4',
      background: '#2d2d2d'
    }
  };

  const theme = isDarkMode ? colors.dark : colors.light;

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Revenus',
        data: data?.income || [],
        borderColor: theme.income,
        backgroundColor: `${theme.income}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme.income,
        pointBorderColor: theme.background,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Dépenses',
        data: data?.expense || [],
        borderColor: theme.expense,
        backgroundColor: `${theme.expense}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme.expense,
        pointBorderColor: theme.background,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.text,
          font: {
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: !!title,
        text: title,
        color: theme.text,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#383838' : '#FFFFFF',
        titleColor: theme.text,
        bodyColor: theme.text,
        borderColor: isDarkMode ? '#404040' : '#F5F7FA',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: €${context.parsed.y.toLocaleString('fr-FR')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.grid,
          borderColor: theme.grid
        },
        ticks: {
          color: theme.text,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: theme.grid,
          borderColor: theme.grid
        },
        ticks: {
          color: theme.text,
          font: {
            size: 11
          },
          callback: function(value) {
            return `€${value.toLocaleString('fr-FR')}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  return (
    <div className="relative h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
