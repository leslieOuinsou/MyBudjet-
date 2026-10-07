import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import { useTheme } from '../context/ThemeContext';
import { 
  getProjectedBalance, 
  getForecastChartData, 
  getPersonalizedAdvice, 
  getForecastOverview 
} from '../api.js';

import { formatMoney, getLocale } from '../lib/format.js';
export default function ForecastsPage() {
  const { isDarkMode } = useTheme();
  
  // États pour les données dynamiques
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [advice, setAdvice] = useState([]);
  const [adviceAnalysis, setAdviceAnalysis] = useState(null);
  const [selectedAdvice, setSelectedAdvice] = useState(null);
  const [projectionMonths, setProjectionMonths] = useState(1);

  // Charger les données au montage du composant
  useEffect(() => {
    loadForecastData();
  }, [projectionMonths]);

  const loadForecastData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📊 Chargement des données de prévisions...');

      // Charger toutes les données en parallèle
      const [overviewData, chartDataResult, adviceData] = await Promise.all([
        getForecastOverview(),
        getForecastChartData(6),
        getPersonalizedAdvice()
      ]);

      console.log('📈 Overview reçu:', overviewData);
      console.log('📊 Chart data reçu:', chartDataResult);
      console.log('💡 Conseils reçus:', adviceData);

      setOverview(overviewData);
      setChartData(chartDataResult);
      setAdvice(adviceData.advice || []);
      setAdviceAnalysis(adviceData.analysis || null);
      
      console.log('✅ Toutes les données de prévisions chargées avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des prévisions');
      console.error('❌ Erreur chargement prévisions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    return formatMoney(amount);
  };

  // Fonction pour obtenir la couleur selon le type de conseil
  const getAdviceColor = (type) => {
    switch (type) {
      case 'warning': return 'border-amber-300 dark:border-[#92400E] bg-amber-50 dark:bg-[#78350F]/30';
      case 'success': return 'border-green-300 dark:border-[#166534] bg-green-50 dark:bg-[#14532D]/30';
      case 'info': return 'border-blue-300 bg-blue-50 dark:bg-[#1E40AF]/25';
      case 'suggestion': return 'border-violet-300 bg-violet-50';
      default: return 'border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#334155]/50';
    }
  };

  // Actions concrètes proposées dans la fenêtre « Voir les détails »
  const getAdviceActions = (item) => {
    const title = (item.title || '').toLowerCase();
    if (title.includes('dépassé')) return [{ label: 'Voir mes budgets', to: '/budgets' }, { label: 'Voir mes dépenses', to: '/expenses' }];
    if (title.includes('épargne')) return [{ label: "Lancer un défi d'épargne", to: '/challenges' }, { label: 'Voir mes budgets', to: '/budgets' }];
    if (title.includes('optimisez')) return [{ label: `Fixer un budget${item.category ? ` pour ${item.category}` : ''}`, to: '/budgets' }, { label: 'Voir mes dépenses', to: '/expenses' }];
    if (title.includes('abonnement')) return [{ label: 'Voir mes abonnements détectés', to: '/insights' }, { label: 'Voir mes transactions récurrentes', to: '/recurring' }];
    if (title.includes('diversifiez')) return [{ label: 'Voir mes revenus', to: '/transactions' }];
    if (title.includes('excellente')) return [{ label: "Relever un défi d'épargne", to: '/challenges' }];
    return [{ label: 'Voir mes rapports', to: '/reports' }];
  };

  // Fonction pour obtenir l'icône selon le type de conseil
  const getAdviceIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'suggestion': return '💡';
      default: return '📊';
    }
  };

  // Préparer les données pour le graphique Chart.js
  const prepareChartData = () => {
    if (!chartData || !chartData.projections) return null;

    const labels = chartData.projections.map(proj => {
      const date = new Date(proj.month + '-01');
      return date.toLocaleDateString(getLocale(), { month: 'short', year: 'numeric' });
    });

    // Utiliser les bons champs de l'API: income, expenses, cumulativeBalance
    const incomeData = chartData.projections.map(proj => proj.income || 0);
    const expensesData = chartData.projections.map(proj => Math.abs(proj.expenses || 0));
    const balanceData = chartData.projections.map(proj => proj.cumulativeBalance || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Revenus projetés',
          data: incomeData,
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
        {
          label: 'Dépenses projetées',
          data: expensesData,
          borderColor: '#64748B',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
        {
          label: 'Solde cumulé',
          data: balanceData,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
        <div className='flex flex-1'>
          <DashboardSidebar />
          <main className='flex-1 py-10 px-4 md:px-12 flex items-center justify-center'>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-[#64748B] dark:text-[#94A3B8]'}>Chargement des prévisions...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

	return (
		<div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
			<div className='flex flex-1'>
				<DashboardSidebar />
				{/* Main content */}
				<main className='flex-1 py-10 px-4 md:px-12'>
					<div className='flex flex-wrap items-center justify-between gap-3 mb-8'>
						<h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>Prévisions Financières & Conseils</h1>
						<a
							href='#conseils'
							onClick={(e) => { e.preventDefault(); document.getElementById('conseils')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
							className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]'
						>
							💡 Voir mes conseils{advice.length > 0 ? ` (${advice.length})` : ''}
						</a>
					</div>
					
					{/* Message d'erreur */}
					{error && (
						<div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 dark:bg-[#7F1D1D]/50 border border-red-300 dark:border-[#991B1B] text-red-700 dark:text-[#FCA5A5]'}`}>
							<div className="flex items-center">
								<span className="mr-2">❌</span>
								{error}
							</div>
						</div>
					)}

					{/* KPIs */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
						<div className={`rounded-lg border p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]'}`}>
							<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>Solde Projeté</div>
							<div className='text-2xl font-bold text-[#2563EB] dark:text-[#60A5FA]'>
								{formatAmount(overview?.projectedBalance)}
							</div>
							<div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
								Projection du solde de vos comptes à la fin du mois prochain.
							</div>
							{overview?.trends?.balanceTrend && (
								<div className={`text-xs ${overview.trends.balanceTrend === 'positive' ? 'text-[#16A34A] dark:text-[#22C55E]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
									{overview.trends.balanceTrend === 'positive' ? '↗️ Tendance positive' : '↘️ Tendance négative'}
								</div>
							)}
						</div>
						<div className={`rounded-lg border p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]'}`}>
							<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>Épargne Estimée</div>
							<div className='text-2xl font-bold text-[#16A34A] dark:text-[#22C55E]'>
								{formatAmount(overview?.estimatedSavings)}
							</div>
							<div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
								Épargne potentielle en suivant vos objectifs budgétaires.
							</div>
							{overview?.trends?.savingsTrend && (
								<div className={`text-xs ${overview.trends.savingsTrend === 'positive' ? 'text-[#16A34A] dark:text-[#22C55E]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
									{overview.trends.savingsTrend === 'positive' ? '↗️ Épargne croissante' : '↘️ Épargne décroissante'}
								</div>
							)}
						</div>
						<div className={`rounded-lg border p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]'}`}>
							<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>Dépenses Futures</div>
							<div className='text-2xl font-bold text-[#64748B] dark:text-[#94A3B8]'>
								{formatAmount(overview?.futureExpenses)}
							</div>
							<div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
								Estimation des dépenses prévues pour le mois suivant.
							</div>
							{overview?.trends?.expensesTrend && (
								<div className={`text-xs ${overview.trends.expensesTrend === 'stable' ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
									{overview.trends.expensesTrend === 'stable' ? '➡️ Dépenses stables' : '↗️ Dépenses croissantes'}
								</div>
							)}
						</div>
					</div>
					{/* Chart */}
					<div className={`rounded-lg border p-6 mb-8 ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]'}`}>
						<div className='flex justify-between items-center mb-4'>
							<div>
								<div className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
									Projections Financières sur 6 Mois
									{chartData?.projections && (
										<span className='ml-3 text-xs font-normal text-[#16A34A] dark:text-[#22C55E]'>
											({chartData.projections.length} mois projetés)
										</span>
									)}
								</div>
								<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
									Basé sur vos transactions réelles des derniers mois
								</div>
							</div>
							<button 
								className='bg-[#2563EB] dark:bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition'
								onClick={loadForecastData}
								disabled={loading}
							>
								{loading ? '⏳' : '🔄'} Actualiser
							</button>
						</div>
						
						{chartData ? (
							chartData.projections && chartData.projections.length > 0 ? (
								<div className='space-y-4'>
									{/* Résumé des projections */}
									<div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg ${isDarkMode ? 'bg-[#334155]' : 'bg-gray-50 dark:bg-[#334155]/50'}`}>
										<div className='text-center'>
											<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Revenus moyens/mois</div>
											<div className='text-lg font-semibold text-[#16A34A] dark:text-[#22C55E]'>
												{formatAmount(chartData.summary?.avgMonthlyIncome)}
											</div>
										</div>
										<div className='text-center'>
											<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Dépenses moyennes/mois</div>
											<div className='text-lg font-semibold text-[#64748B] dark:text-[#94A3B8]'>
												{formatAmount(chartData.summary?.avgMonthlyExpenses)}
											</div>
										</div>
										<div className='text-center'>
											<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Solde moyen/mois</div>
											<div className={`text-lg font-semibold ${
												(chartData.summary?.avgMonthlyBalance || 0) >= 0 ? 'text-[#16A34A] dark:text-[#22C55E]' : 'text-[#64748B] dark:text-[#94A3B8]'
											}`}>
												{formatAmount(chartData.summary?.avgMonthlyBalance)}
											</div>
										</div>
									</div>
									
									{/* Graphique Chart.js */}
									<div className='h-80'>
										<LineChart data={prepareChartData()} isDarkMode={isDarkMode} />
									</div>
								</div>
							) : (
								<div className='h-64 flex items-center justify-center'>
									<div className='text-center'>
										<div className='text-4xl mb-4'>📊</div>
										<div className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
											Pas assez de données
										</div>
										<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
											Ajoutez des transactions pour générer des prévisions personnalisées
										</div>
									</div>
								</div>
							)
						) : (
							<div className='h-64 flex items-center justify-center'>
								<div className='text-center'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2'></div>
									<div className={isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}>Chargement du graphique...</div>
								</div>
							</div>
						)}
					</div>
					{/* Conseils personnalisés */}
					<div id='conseils' className='mb-8 scroll-mt-6'>
						<div className='flex justify-between items-center mb-4'>
							<div>
								<div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
									Conseils Personnalisés pour Vous
								</div>
								<div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>
									Basés sur l'analyse de vos transactions et budgets
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<span className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-[#DCFCE7] dark:bg-[#14532D]/50 text-[#166534] dark:text-[#86EFAC]'}`}>
									{advice.length > 0 ? `${advice.length} conseil${advice.length > 1 ? 's' : ''}` : 'Analyse en cours'}
								</span>
							</div>
						</div>
						
						{advice.length > 0 ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
								{advice.map((adviceItem, index) => (
									<div
										key={index}
										className={`rounded-lg border p-6 flex flex-col gap-3 ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : getAdviceColor(adviceItem.type)}`}
									>
										<div className='flex items-start justify-between'>
											<div className={`font-bold mb-1 flex-1 ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
												{getAdviceIcon(adviceItem.type)} {adviceItem.title}
											</div>
											{adviceItem.priority && (
												<span className={`text-xs px-2 py-1 rounded-full ${
													adviceItem.priority === 'high' ? 'bg-[#334155] text-white' :
													adviceItem.priority === 'medium' ? 'bg-[#64748B] text-white' :
													isDarkMode ? 'bg-[#334155] text-gray-300' : 'bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#CBD5E1]'
												}`}>
													{adviceItem.priority === 'high' ? 'Urgent' :
													 adviceItem.priority === 'medium' ? 'Important' : 'Info'}
												</span>
											)}
										</div>
										
										<div className={`text-sm mb-4 flex-1 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
											{adviceItem.description}
										</div>
										
										{/* Informations additionnelles selon le type de conseil */}
										{adviceItem.amount && (
											<div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-[#334155]' : 'text-gray-600 dark:text-[#CBD5E1] bg-white dark:bg-[#1E293B] bg-opacity-50'}`}>
												Montant concerné: {formatAmount(adviceItem.amount)}
											</div>
										)}
										
										{adviceItem.category && (
											<div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-[#334155]' : 'text-gray-600 dark:text-[#CBD5E1] bg-white dark:bg-[#1E293B] bg-opacity-50'}`}>
												Catégorie: {adviceItem.category}
											</div>
										)}
										
										{adviceItem.currentRate && adviceItem.targetRate && (
											<div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-[#334155]' : 'text-gray-600 dark:text-[#CBD5E1] bg-white dark:bg-[#1E293B] bg-opacity-50'}`}>
												Taux actuel: {adviceItem.currentRate.toFixed(1)}% → Objectif: {adviceItem.targetRate}%
											</div>
										)}
										
										<button 
											className={`w-fit px-4 py-2 rounded font-semibold text-sm transition ${isDarkMode ? 'bg-[#334155] text-[#2563EB] dark:text-[#60A5FA] border border-[#334155] hover:bg-[#334155]' : 'bg-white dark:bg-[#1E293B] bg-opacity-80 text-[#2563EB] dark:text-[#60A5FA] border border-white dark:border-[#334155] hover:bg-opacity-100'}`}
											onClick={() => setSelectedAdvice(adviceItem)}
										>
											Voir les détails
										</button>
									</div>
								))}
							</div>
						) : (
							<div className={`rounded-lg border p-8 text-center ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]'}`}>
								<div className='text-4xl mb-4'>📊</div>
								<div className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>Aucun conseil disponible</div>
								<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
									Ajoutez plus de transactions pour recevoir des conseils personnalisés basés sur vos habitudes financières.
								</div>
							</div>
						)}
					</div>
				</main>
				{selectedAdvice && (
					<div
						className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
						role='dialog'
						aria-modal='true'
						aria-label={selectedAdvice.title}
						onClick={() => setSelectedAdvice(null)}
						onKeyDown={(e) => e.key === 'Escape' && setSelectedAdvice(null)}
					>
						<div className='bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6' onClick={(e) => e.stopPropagation()}>
							<div className='flex items-start justify-between gap-4 mb-3'>
								<h3 className='text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]'>{getAdviceIcon(selectedAdvice.type)} {selectedAdvice.title}</h3>
								<button onClick={() => setSelectedAdvice(null)} className='text-gray-500 dark:text-[#94A3B8] hover:text-gray-800 dark:hover:text-[#F8FAFC]' aria-label='Fermer' autoFocus>✕</button>
							</div>
							<p className='text-sm text-[#334155] dark:text-[#E2E8F0] mb-4'>{selectedAdvice.description}</p>

							{(adviceAnalysis || selectedAdvice.category || selectedAdvice.percentage) && (
								<div className='rounded-xl bg-[#F8FAFC] dark:bg-[#334155]/50 p-4 mb-4'>
									<div className='text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase mb-2'>Pourquoi ce conseil</div>
									<ul className='text-sm text-[#0F172A] dark:text-[#F8FAFC] space-y-1'>
										{adviceAnalysis && <li>Revenus de la période : <strong>{formatAmount(adviceAnalysis.totalIncome)}</strong></li>}
										{adviceAnalysis && <li>Dépenses de la période : <strong>{formatAmount(adviceAnalysis.totalExpenses)}</strong></li>}
										{adviceAnalysis && <li>Taux d’épargne : <strong>{Number(adviceAnalysis.savingsRate || 0).toFixed(1)} %</strong></li>}
										{selectedAdvice.category && <li>Catégorie concernée : <strong>{selectedAdvice.category}</strong>{selectedAdvice.percentage ? ` (${Number(selectedAdvice.percentage).toFixed(0)} % de vos dépenses)` : ''}</li>}
										{selectedAdvice.amount ? <li>Montant concerné : <strong>{formatAmount(selectedAdvice.amount)}</strong></li> : null}
									</ul>
									{adviceAnalysis?.topCategories?.length > 0 && (
										<div className='mt-3 text-sm text-[#0F172A] dark:text-[#F8FAFC]'>
											<div className='text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase mb-1'>Vos plus gros postes</div>
											{adviceAnalysis.topCategories.map((c) => (
												<div key={c.category} className='flex justify-between'><span>{c.category}</span><span className='font-semibold'>{formatAmount(c.amount)}</span></div>
											))}
										</div>
									)}
								</div>
							)}

							<div className='text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase mb-2'>Que faire ?</div>
							<div className='flex flex-wrap gap-2'>
								{getAdviceActions(selectedAdvice).map((action) => (
									<Link key={action.to + action.label} to={action.to} className='px-4 py-2 rounded-lg bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]'>
										{action.label}
									</Link>
								))}
								<button onClick={() => setSelectedAdvice(null)} className='px-4 py-2 rounded-lg border border-gray-300 dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC]'>Fermer</button>
							</div>
						</div>
					</div>
				)}
				{/* Sidebar mobile (déconnexion) */}
				<aside className='md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155] p-4 flex justify-center'>
					<button className='bg-[#2563EB] dark:bg-[#3B82F6] text-white px-6 py-2 rounded font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] flex items-center gap-2'>
						<span className='text-lg'>⏻</span> Se déconnecter
					</button>
				</aside>
			</div>
		</div>
	);
}
