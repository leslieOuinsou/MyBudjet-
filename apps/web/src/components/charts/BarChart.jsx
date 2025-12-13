import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart({ data, title }) {
  // Couleurs pour le thème clair - Palette Fintech
  const theme = {
    spent: '#6C757D',      // Gris anthracite pour dépenses (sérieux)
    budget: '#1E73BE',     // Bleu pour budget (confiance, sécurité)
    exceeded: '#495057',   // Gris foncé pour dépassement (au lieu d'orange)
    grid: '#F5F7FA',       // Gris clair pour grille
    text: '#343A40',       // Anthracite pour texte
    background: '#FFFFFF'  // Blanc pour fond
  };

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Budget Alloué',
        data: data?.budget || [],
        backgroundColor: theme.budget,
        borderColor: theme.budget,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Dépenses Réelles',
        data: data?.spent || [],
        backgroundColor: data?.spent?.map((spent, index) => {
          const budget = data?.budget?.[index] || 0;
          return spent > budget ? theme.exceeded : theme.spent;
        }) || theme.spent,
        borderColor: data?.spent?.map((spent, index) => {
          const budget = data?.budget?.[index] || 0;
          return spent > budget ? theme.exceeded : theme.spent;
        }) || theme.spent,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
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
          pointStyle: 'rect'
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
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: €${value.toLocaleString('fr-FR')}`;
          },
          afterLabel: function(context) {
            if (context.datasetIndex === 1) { // Dépenses réelles
              const spent = context.parsed.y;
              const budgetIndex = context.dataIndex;
              const budget = data?.budget?.[budgetIndex] || 0;
              
              if (budget > 0) {
                const percentage = ((spent / budget) * 100).toFixed(1);
                const status = spent > budget ? '⚠️ Dépassé' : '✅ Respecté';
                return `${status} (${percentage}% du budget)`;
              }
            }
            return '';
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
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="relative h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
