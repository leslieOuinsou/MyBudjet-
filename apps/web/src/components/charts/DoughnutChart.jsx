import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart({ data, title, isDarkMode = false }) {
  // Couleurs adaptées au thème
  const colors = {
    light: {
      background: '#FFFFFF',
      text: '#343A40',
      grid: '#F5F7FA'
    },
    dark: {
      background: '#2d2d2d',
      text: '#e4e4e4',
      grid: '#404040'
    }
  };

  const theme = isDarkMode ? colors.dark : colors.light;

  // Couleurs prédéfinies pour les catégories
  const categoryColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
    '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
  ];

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        data: data?.values || [],
        backgroundColor: categoryColors.slice(0, data?.labels?.length || 0),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#F5F7FA'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.text,
          font: {
            size: 11,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
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
        backgroundColor: '#FFFFFF',
        titleColor: theme.text,
        bodyColor: theme.text,
        borderColor: '#F5F7FA',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: €${value.toLocaleString('fr-FR')} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 2
      }
    }
  };

  return (
    <div className="relative h-64 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
