import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getReportsData, getFinancialStats, getCategoryAnalytics, getTopTransactions, exportReportData, getTrendsData, getBudgetComparison } from '../api.js';
import LineChart from '../components/charts/LineChart.jsx';
import DoughnutChart from '../components/charts/DoughnutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';

import { formatMoney, formatDate, getLocale } from '../lib/format.js';
const chartPlaceholder = (text = "Graphique") => (
  <div className="flex items-center justify-center h-56 w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] text-lg font-bold">
    {text}
  </div>
);

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [period, setPeriod] = useState('month');
  
  // Données du rapport
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    incomeVariation: 0,
    expenseVariation: 0,
    savingsVariation: 0
  });
  const [categoryAnalytics, setCategoryAnalytics] = useState({ categories: [], totalAmount: 0 });
  const [topTransactions, setTopTransactions] = useState({ transactions: [] });
  
  // Données pour les graphiques
  const [chartData, setChartData] = useState({
    trends: {
      labels: [],
      income: [],
      expense: []
    },
    categories: {
      labels: [],
      values: []
    },
    budget: {
      labels: [],
      budget: [],
      spent: []
    }
  });

  useEffect(() => {
    loadReportData();
  }, [period]);

  // Fermer le menu d'export en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.getElementById('export-menu');
      const button = event.target.closest('button');
      if (menu && !menu.contains(event.target) && (!button || !button.textContent.includes('Exporter'))) {
        menu.classList.add('hidden');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsData, categoryData, topTransactionsData, trendsData, budgetData] = await Promise.all([
        getFinancialStats(period),
        getCategoryAnalytics(),
        getTopTransactions(5, 'expense'),
        getTrendsData(period),
        getBudgetComparison(period)
      ]);
      
      setStats(statsData);
      setCategoryAnalytics(categoryData);
      setTopTransactions(topTransactionsData);
      
      // Utiliser les vraies données pour les graphiques
      generateChartDataFromAPI(trendsData, categoryData, budgetData, period);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données du rapport');
      // Générer des données de démonstration en cas d'erreur
      generateChartData(period);
    } finally {
      setLoading(false);
    }
  };

  // Générer les données des graphiques à partir des vraies données API
  const generateChartDataFromAPI = (trendsData, categoryData, budgetData, period) => {
    console.log('📊 Données reçues pour les graphiques:', { trendsData, categoryData, budgetData, period });

    // 1. Données pour le graphique en courbe (tendances)
    let trendsChartData = { labels: [], income: [], expense: [] };
    
    if (trendsData?.trends && Array.isArray(trendsData.trends)) {
      // Utiliser les données réelles des tendances
      trendsChartData.labels = trendsData.trends.map(trend => {
        if (period === 'week') {
          return new Date(trend.month).toLocaleDateString(getLocale(), { weekday: 'short' });
        } else if (period === 'month') {
          return `Sem ${trendsData.trends.indexOf(trend) + 1}`;
        } else if (period === 'year') {
          return new Date(trend.month).toLocaleDateString(getLocale(), { month: 'short' });
        }
        return trend.month;
      });
      trendsChartData.income = trendsData.trends.map(trend => trend.income || 0);
      trendsChartData.expense = trendsData.trends.map(trend => trend.expense || 0);
    } else {
      // Fallback si pas de données
      trendsChartData = generateFallbackTrendsData(period);
    }

    // 2. Données pour le graphique en donut (catégories)
    let categoriesChartData = { labels: [], values: [] };
    
    if (categoryData?.categories && Array.isArray(categoryData.categories)) {
      categoriesChartData.labels = categoryData.categories.map(cat => cat.categoryName || cat.name || 'Non catégorisé');
      categoriesChartData.values = categoryData.categories.map(cat => cat.total || 0);
    } else {
      // Fallback si pas de données
      categoriesChartData = generateFallbackCategoriesData();
    }

    // 3. Données pour le graphique en barres (budget)
    let budgetChartData = { labels: [], budget: [], spent: [] };
    
    if (budgetData?.comparison && Array.isArray(budgetData.comparison)) {
      budgetChartData.labels = budgetData.comparison.map(item => item.categoryName || 'Non catégorisé');
      budgetChartData.budget = budgetData.comparison.map(item => item.budgeted || 0);
      budgetChartData.spent = budgetData.comparison.map(item => item.spent || 0);
    } else {
      // Fallback si pas de données
      budgetChartData = generateFallbackBudgetData();
    }

    setChartData({
      trends: trendsChartData,
      categories: categoriesChartData,
      budget: budgetChartData
    });

    console.log('📈 Données des graphiques mises à jour:', {
      trends: trendsChartData,
      categories: categoriesChartData,
      budget: budgetChartData
    });
  };

  // Données de fallback pour les tendances
  const generateFallbackTrendsData = (period) => {
    let labels, income, expense;
    
    switch (period) {
      case 'week':
        labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        income = [0, 0, 0, 0, 0, 0, 0];
        expense = [0, 0, 0, 0, 0, 0, 0];
        break;
      case 'month':
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        income = [0, 0, 0, 0];
        expense = [0, 0, 0, 0];
        break;
      case 'year':
        labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        income = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        expense = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        break;
      default:
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        income = [0, 0, 0, 0];
        expense = [0, 0, 0, 0];
    }

    return { labels, income, expense };
  };

  // Données de fallback pour les catégories
  const generateFallbackCategoriesData = () => {
    return {
      labels: ['Aucune donnée'],
      values: [1]
    };
  };

  // Données de fallback pour le budget
  const generateFallbackBudgetData = () => {
    return {
      labels: ['Aucun budget'],
      budget: [0],
      spent: [0]
    };
  };

  // Fonction de fallback (données de démonstration)
  const generateChartData = (period) => {
    let labels, income, expense, categories, categoryValues, budgetLabels, budgets, spent;
    
    switch (period) {
      case 'week':
        labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        income = [450, 380, 520, 340, 480, 320, 280];
        expense = [120, 180, 95, 220, 160, 85, 140];
        break;
      case 'month':
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        income = [1800, 1950, 1700, 2100];
        expense = [1200, 1350, 1100, 1450];
        break;
      case 'year':
        labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        income = [7200, 6800, 7500, 7200, 7800, 7300, 7100, 7600, 7400, 7200, 7300, 7500];
        expense = [4800, 4600, 5100, 4900, 5200, 4800, 4700, 5000, 4900, 4800, 4900, 5100];
        break;
      default:
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        income = [1800, 1950, 1700, 2100];
        expense = [1200, 1350, 1100, 1450];
    }

    // Données pour le graphique en donut (catégories)
    categories = ['Nourriture', 'Transport', 'Loisirs', 'Shopping', 'Santé'];
    categoryValues = [850, 420, 380, 320, 180];

    // Données pour le graphique en barres (budget)
    budgetLabels = ['Nourriture', 'Transport', 'Loisirs', 'Shopping', 'Santé'];
    budgets = [1000, 500, 400, 350, 200];
    spent = [850, 420, 380, 320, 180];

    setChartData({
      trends: { labels, income, expense },
      categories: { labels: categories, values: categoryValues },
      budget: { labels: budgetLabels, budget: budgets, spent }
    });
  };

  const handleExport = async (format) => {
    try {
      setError('');
      const data = await exportReportData(format, { period });
      
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_finances_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_finances_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      setSuccess('Rapport exporté avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export du rapport');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Génération du rapport...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-3 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 lg:py-10 flex flex-col pt-16 md:pt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 lg:mb-8 gap-3 md:gap-4">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#0F172A]">Rapports Financiers</h1>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center w-full sm:w-auto">
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg px-3 md:px-4 py-2 text-sm md:text-base bg-[#F8FAFC] text-[#0F172A] focus:border-[#2563EB] w-full sm:w-auto"
              >
                <option value="week">Cette Semaine</option>
                <option value="month">Ce Mois</option>
                <option value="year">Cette Année</option>
              </select>
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => document.getElementById('export-menu').classList.toggle('hidden')}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-3 md:px-5 py-2 rounded-lg shadow transition text-sm md:text-base w-full sm:w-auto"
                >
                  Exporter ▼
                </button>
                <div id="export-menu" className="hidden absolute top-full right-0 mt-2 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-10">
                  <button 
                    onClick={() => {
                      handleExport('csv');
                      document.getElementById('export-menu').classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-[#F8FAFC] text-[#0F172A]"
                  >
                    📄 Export CSV
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('pdf');
                      document.getElementById('export-menu').classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-[#F8FAFC] text-[#0F172A]"
                  >
                    📑 Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-[#DCFCE7] border border-[#16A34A] text-[#166534] rounded-lg">
              {success}
            </div>
          )}
          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2">
              <span className="text-[#64748B] text-xs md:text-sm">Revenu Total</span>
              <div className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-bold text-[#16A34A]">
                {formatMoney(stats.totalIncome)}
              </div>
              <span className={`text-[10px] md:text-xs ${stats.incomeVariation >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {stats.incomeVariation >= 0 ? '↑' : '↓'} {Math.abs(stats.incomeVariation || 0).toFixed(1)}% 
                <span className="hidden sm:inline"> {period === 'week' ? ' cette semaine' : period === 'month' ? ' ce mois-ci' : ' cette année'}</span>
              </span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2">
              <span className="text-[#64748B] text-xs md:text-sm">Dépenses Totales</span>
              <div className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-bold text-[#DC2626]">
                {formatMoney(stats.totalExpense)}
              </div>
              <span className={`text-[10px] md:text-xs ${stats.expenseVariation <= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {stats.expenseVariation >= 0 ? '↑' : '↓'} {Math.abs(stats.expenseVariation || 0).toFixed(1)}% 
                <span className="hidden sm:inline"> {period === 'week' ? ' cette semaine' : period === 'month' ? ' ce mois-ci' : ' cette année'}</span>
              </span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2 sm:col-span-2 md:col-span-1">
              <span className="text-[#64748B] text-xs md:text-sm">Épargne Nette</span>
              <div className={`flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-bold ${stats.savings >= 0 ? 'text-[#2563EB]' : 'text-[#DC2626]'}`}>
                {stats.savings >= 0 ? '+' : ''} {formatMoney(stats.savings)}
              </div>
              <span className={`text-[10px] md:text-xs ${stats.savingsVariation >= 0 ? 'text-[#2563EB]' : 'text-[#DC2626]'}`}>
                {stats.savingsVariation >= 0 ? '↑' : '↓'} {Math.abs(stats.savingsVariation || 0).toFixed(1)}% 
                <span className="hidden sm:inline"> {period === 'week' ? ' cette semaine' : period === 'month' ? ' ce mois-ci' : ' cette année'}</span>
              </span>
            </div>
          </div>
          {/* Graphiques et résumé */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2">
              <span className="font-bold text-[#0F172A] mb-2 text-sm md:text-base">Tendance des Revenus et Dépenses</span>
              <span className="text-[#64748B] text-xs md:text-sm mb-2 hidden sm:block">Visualisation de l'évolution des revenus et dépenses sur la période sélectionnée.</span>
              <LineChart 
                data={chartData.trends} 
              />
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2">
              <span className="font-bold text-[#0F172A] mb-2 text-sm md:text-base">Répartition des Dépenses par Catégorie</span>
              <span className="text-[#64748B] text-xs md:text-sm mb-2 hidden sm:block">Analyse des dépenses par catégorie pour identifier les principaux postes.</span>
              <DoughnutChart 
                data={chartData.categories} 
              />
              <div className="mt-4 space-y-2">
                {categoryAnalytics.categories.slice(0, 3).map((cat, index) => (
                  <div key={cat.categoryId || index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: cat.categoryColor }}
                      ></span>
                      {cat.categoryName}
                    </span>
                    <span className="font-semibold">
                      {formatMoney(cat.total)} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2">
              <span className="font-bold text-[#0F172A] mb-2 text-sm md:text-base">Adhérence au Budget</span>
              <span className="text-[#64748B] text-xs md:text-sm mb-2 hidden sm:block">Comparaison des dépenses réelles avec les budgets alloués par catégorie.</span>
              <BarChart 
                data={chartData.budget} 
              />
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-[#E2E8F0] flex flex-col gap-2">
              <span className="font-bold text-[#0F172A] mb-2 text-sm md:text-base">Top Dépenses de la Période</span>
              <span className="text-[#64748B] text-xs md:text-sm mb-2 hidden sm:block">Les transactions les plus importantes de la période sélectionnée.</span>
              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full text-xs md:text-sm lg:text-base">
                  <thead>
                    <tr className="bg-[#F8FAFC]">
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#0F172A] font-bold text-xs md:text-sm">Date</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#0F172A] font-bold text-xs md:text-sm">Description</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#0F172A] font-bold text-xs md:text-sm hidden md:table-cell">Catégorie</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#0F172A] font-bold text-xs md:text-sm">Montant</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#0F172A] font-bold text-xs md:text-sm hidden lg:table-cell">Portefeuille</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTransactions.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-[#64748B]">
                          Aucune transaction trouvée pour cette période
                        </td>
                      </tr>
                    ) : (
                      topTransactions.transactions.map((transaction, index) => (
                        <tr key={transaction._id} className="even:bg-white odd:bg-[#F8FAFC] hover:bg-[#DBEAFE] transition">
                          <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-[#0F172A] text-xs md:text-sm">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-[#0F172A] text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{transaction.description}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 hidden md:table-cell">
                            <span className="bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 text-[10px] md:text-xs text-[#0F172A]">
                              {transaction.category?.name || 'Non catégorisé'}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 font-semibold text-[#DC2626] text-xs md:text-sm">
                            - {formatMoney(transaction.amount)}
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                            <span className="bg-[#DBEAFE] border border-[#B3E5FC] rounded px-2 py-1 text-[10px] md:text-xs text-[#2563EB]">
                              {transaction.wallet?.name || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
