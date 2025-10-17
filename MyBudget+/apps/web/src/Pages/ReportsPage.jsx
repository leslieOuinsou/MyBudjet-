import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getReportsData, getFinancialStats, getCategoryAnalytics, getTopTransactions, exportReportData, getTrendsData, getBudgetComparison } from '../api.js';
import LineChart from '../components/charts/LineChart.jsx';
import DoughnutChart from '../components/charts/DoughnutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const chartPlaceholder = (text = "Graphique") => (
  <div className="flex items-center justify-center h-56 w-full bg-[#F5F7FA] border border-[#EAF4FB] rounded-xl text-[#6C757D] text-lg font-bold">
    {text}
  </div>
);

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [period, setPeriod] = useState('month');
  const { theme } = useTheme();
  
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
          return new Date(trend.month).toLocaleDateString('fr-FR', { weekday: 'short' });
        } else if (period === 'month') {
          return `Sem ${trendsData.trends.indexOf(trend) + 1}`;
        } else if (period === 'year') {
          return new Date(trend.month).toLocaleDateString('fr-FR', { month: 'short' });
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
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">Génération du rapport...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-12 py-10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-[#22292F] dark:text-[#e4e4e4]">Rapports Financiers</h1>
            <div className="flex gap-4 items-center">
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-[#EAF4FB] dark:border-[#404040] rounded-lg px-4 py-2 bg-[#F9FAFB] dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:border-[#1E73BE]"
              >
                <option value="week">Cette Semaine</option>
                <option value="month">Ce Mois</option>
                <option value="year">Cette Année</option>
              </select>
              <div className="relative">
                <button 
                  onClick={() => document.getElementById('export-menu').classList.toggle('hidden')}
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5 py-2 rounded-lg shadow transition"
                >
                  Exporter ▼
                </button>
                <div id="export-menu" className="hidden absolute top-full right-0 mt-2 bg-white border border-[#EAF4FB] rounded-lg shadow-lg z-10">
                  <button 
                    onClick={() => {
                      handleExport('csv');
                      document.getElementById('export-menu').classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-[#F5F7FA] text-[#22292F]"
                  >
                    📄 Export CSV
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('pdf');
                      document.getElementById('export-menu').classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-[#F5F7FA] text-[#22292F]"
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
            <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm">Revenu Total</span>
              <div className="flex items-center gap-2 text-2xl font-bold text-[#22C55E]">
                {stats.totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <span className={`text-xs ${stats.incomeVariation >= 0 ? 'text-[#22C55E]' : 'text-[#DC2626]'}`}>
                {stats.incomeVariation >= 0 ? '↑' : '↓'} {Math.abs(stats.incomeVariation || 0).toFixed(1)}% 
                {period === 'week' ? ' cette semaine' : period === 'month' ? ' ce mois-ci' : ' cette année'}
              </span>
            </div>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm">Dépenses Totales</span>
              <div className="flex items-center gap-2 text-2xl font-bold text-[#DC2626]">
                {stats.totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <span className={`text-xs ${stats.expenseVariation <= 0 ? 'text-[#22C55E]' : 'text-[#DC2626]'}`}>
                {stats.expenseVariation >= 0 ? '↑' : '↓'} {Math.abs(stats.expenseVariation || 0).toFixed(1)}% 
                {period === 'week' ? ' cette semaine' : period === 'month' ? ' ce mois-ci' : ' cette année'}
              </span>
            </div>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm">Épargne Nette</span>
              <div className={`flex items-center gap-2 text-2xl font-bold ${stats.savings >= 0 ? 'text-[#1E73BE]' : 'text-[#DC2626]'}`}>
                {stats.savings >= 0 ? '+' : ''} {stats.savings.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <span className={`text-xs ${stats.savingsVariation >= 0 ? 'text-[#1E73BE]' : 'text-[#DC2626]'}`}>
                {stats.savingsVariation >= 0 ? '↑' : '↓'} {Math.abs(stats.savingsVariation || 0).toFixed(1)}% 
                {period === 'week' ? ' cette semaine' : period === 'month' ? ' ce mois-ci' : ' cette année'}
              </span>
            </div>
          </div>
          {/* Graphiques et résumé */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="font-bold text-[#22292F] dark:text-[#e4e4e4] mb-2">Tendance des Revenus et Dépenses</span>
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-2">Visualisation de l'évolution des revenus et dépenses sur la période sélectionnée.</span>
              <LineChart 
                data={chartData.trends} 
                isDarkMode={theme === 'dark'} 
              />
            </div>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="font-bold text-[#22292F] dark:text-[#e4e4e4] mb-2">Répartition des Dépenses par Catégorie</span>
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-2">Analyse des dépenses par catégorie pour identifier les principaux postes.</span>
              <DoughnutChart 
                data={chartData.categories} 
                isDarkMode={theme === 'dark'} 
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
                      {cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="font-bold text-[#22292F] dark:text-[#e4e4e4] mb-2">Adhérence au Budget</span>
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-2">Comparaison des dépenses réelles avec les budgets alloués par catégorie.</span>
              <BarChart 
                data={chartData.budget} 
                isDarkMode={theme === 'dark'} 
              />
            </div>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow p-6 border border-[#EAF4FB] dark:border-[#404040] flex flex-col gap-2">
              <span className="font-bold text-[#22292F] dark:text-[#e4e4e4] mb-2">Top Dépenses de la Période</span>
              <span className="text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-2">Les transactions les plus importantes de la période sélectionnée.</span>
              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full text-base">
                  <thead>
                    <tr className="bg-[#F5F7FA] dark:bg-[#383838]">
                      <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e4e4e4] font-bold">Date</th>
                      <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e4e4e4] font-bold">Description</th>
                      <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e4e4e4] font-bold">Catégorie</th>
                      <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e4e4e4] font-bold">Montant</th>
                      <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e4e4e4] font-bold">Portefeuille</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTransactions.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-[#6C757D] dark:text-[#b0b0b0]">
                          Aucune transaction trouvée pour cette période
                        </td>
                      </tr>
                    ) : (
                      topTransactions.transactions.map((transaction, index) => (
                        <tr key={transaction._id} className="even:bg-white dark:even:bg-[#2d2d2d] odd:bg-[#F5F7FA] dark:odd:bg-[#383838] hover:bg-[#EAF4FB] dark:hover:bg-[#404040] transition">
                          <td className="px-4 py-3 font-medium text-[#343A40] dark:text-[#e4e4e4]">
                            {new Date(transaction.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-[#343A40] dark:text-[#e4e4e4]">{transaction.description}</td>
                          <td className="px-4 py-3">
                            <span className="bg-[#F5F7FA] dark:bg-[#383838] border border-[#EAF4FB] dark:border-[#404040] rounded px-2 py-1 text-xs text-[#343A40] dark:text-[#e4e4e4]">
                              {transaction.category?.name || 'Non catégorisé'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#DC2626]">
                            - {transaction.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-[#E0F2FE] dark:bg-[#1a365d] border border-[#B3E5FC] dark:border-[#2d3748] rounded px-2 py-1 text-xs text-[#1E73BE] dark:text-[#63b3ed]">
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
          <footer className="flex flex-col md:flex-row items-center justify-between gap-2 mt-8 text-[#6C757D] text-sm">
            <div className="flex gap-6">
              <span>MyBudget+</span>
              <Link to="/legal" className="hover:text-[#1E73BE] transition">Légal</Link>
              <Link to="/support" className="hover:text-[#1E73BE] transition">Support</Link>
            </div>
            <div className="flex gap-4 text-xl">
              <span className="hover:text-[#1E73BE] cursor-pointer transition">📘</span>
              <span className="hover:text-[#1E73BE] cursor-pointer transition">🐦</span>
              <span className="hover:text-[#1E73BE] cursor-pointer transition">📧</span>
              <span className="hover:text-[#1E73BE] cursor-pointer transition">💼</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
