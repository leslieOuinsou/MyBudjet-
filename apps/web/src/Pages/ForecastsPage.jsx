import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import Footer from '../components/Footer.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import { useTheme } from '../context/ThemeContext';
import { 
  getProjectedBalance, 
  getForecastChartData, 
  getPersonalizedAdvice, 
  getForecastOverview 
} from '../api.js';

export default function ForecastsPage() {
  const { isDarkMode } = useTheme();
  
  // États pour les données dynamiques
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [advice, setAdvice] = useState([]);
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
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  // Fonction pour obtenir la couleur selon le type de conseil
  const getAdviceColor = (type) => {
    switch (type) {
      case 'warning': return 'border-[#6C757D] bg-[#F5F7FA]';
      case 'success': return 'border-[#28A745] bg-[#D4EDDA]';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
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
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
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
          borderColor: '#28A745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
        {
          label: 'Dépenses projetées',
          data: expensesData,
          borderColor: '#6C757D',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
        {
          label: 'Solde cumulé',
          data: balanceData,
          borderColor: '#1E73BE',
          backgroundColor: 'rgba(30, 115, 190, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
        <DashboardHeader />
        <div className='flex flex-1'>
          <DashboardSidebar />
          <main className='flex-1 py-10 px-4 md:px-12 flex items-center justify-center'>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-[#6C757D]'}>Chargement des prévisions...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

	return (
		<div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
			{/* Header */}
			<DashboardHeader />
			<div className='flex flex-1'>
				<DashboardSidebar />
				{/* Main content */}
				<main className='flex-1 py-10 px-4 md:px-12'>
					<h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-[#343A40]'}`}>Prévisions Financières & Conseils</h1>
					
					{/* Message d'erreur */}
					{error && (
						<div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 border border-red-300 text-red-700'}`}>
							<div className="flex items-center">
								<span className="mr-2">❌</span>
								{error}
							</div>
						</div>
					)}

					{/* KPIs */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
						<div className={`rounded-lg border p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#F5F7FA]'}`}>
							<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Solde Projeté</div>
							<div className='text-2xl font-bold text-[#1E73BE]'>
								{formatAmount(overview?.projectedBalance)}
							</div>
							<div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-[#6C757D]'}`}>
								Projection du solde de vos comptes à la fin du mois prochain.
							</div>
							{overview?.trends?.balanceTrend && (
								<div className={`text-xs ${overview.trends.balanceTrend === 'positive' ? 'text-[#28A745]' : 'text-[#6C757D]'}`}>
									{overview.trends.balanceTrend === 'positive' ? '↗️ Tendance positive' : '↘️ Tendance négative'}
								</div>
							)}
						</div>
						<div className={`rounded-lg border p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#F5F7FA]'}`}>
							<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Épargne Estimée</div>
							<div className='text-2xl font-bold text-[#28A745]'>
								{formatAmount(overview?.estimatedSavings)}
							</div>
							<div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-[#6C757D]'}`}>
								Épargne potentielle en suivant vos objectifs budgétaires.
							</div>
							{overview?.trends?.savingsTrend && (
								<div className={`text-xs ${overview.trends.savingsTrend === 'positive' ? 'text-[#28A745]' : 'text-[#6C757D]'}`}>
									{overview.trends.savingsTrend === 'positive' ? '↗️ Épargne croissante' : '↘️ Épargne décroissante'}
								</div>
							)}
						</div>
						<div className={`rounded-lg border p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#F5F7FA]'}`}>
							<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Dépenses Futures</div>
							<div className='text-2xl font-bold text-[#6C757D]'>
								{formatAmount(overview?.futureExpenses)}
							</div>
							<div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-[#6C757D]'}`}>
								Estimation des dépenses prévues pour le mois suivant.
							</div>
							{overview?.trends?.expensesTrend && (
								<div className={`text-xs ${overview.trends.expensesTrend === 'stable' ? 'text-[#1E73BE]' : 'text-[#6C757D]'}`}>
									{overview.trends.expensesTrend === 'stable' ? '➡️ Dépenses stables' : '↗️ Dépenses croissantes'}
								</div>
							)}
						</div>
					</div>
					{/* Chart */}
					<div className={`rounded-lg border p-6 mb-8 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#F5F7FA]'}`}>
						<div className='flex justify-between items-center mb-4'>
							<div>
								<div className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#343A40]'}`}>
									Projections Financières sur 6 Mois
									{chartData?.projections && (
										<span className='ml-3 text-xs font-normal text-[#28A745]'>
											({chartData.projections.length} mois projetés)
										</span>
									)}
								</div>
								<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Basé sur vos transactions réelles des derniers mois
								</div>
							</div>
							<button 
								className='bg-[#1E73BE] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#155a8a] transition'
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
									<div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg ${isDarkMode ? 'bg-[#383838]' : 'bg-gray-50'}`}>
										<div className='text-center'>
											<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenus moyens/mois</div>
											<div className='text-lg font-semibold text-[#28A745]'>
												{formatAmount(chartData.summary?.avgMonthlyIncome)}
											</div>
										</div>
										<div className='text-center'>
											<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dépenses moyennes/mois</div>
											<div className='text-lg font-semibold text-[#6C757D]'>
												{formatAmount(chartData.summary?.avgMonthlyExpenses)}
											</div>
										</div>
										<div className='text-center'>
											<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Solde moyen/mois</div>
											<div className={`text-lg font-semibold ${
												(chartData.summary?.avgMonthlyBalance || 0) >= 0 ? 'text-[#28A745]' : 'text-[#6C757D]'
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
										<div className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#343A40]'}`}>
											Pas assez de données
										</div>
										<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
											Ajoutez des transactions pour générer des prévisions personnalisées
										</div>
									</div>
								</div>
							)
						) : (
							<div className='h-64 flex items-center justify-center'>
								<div className='text-center'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E73BE] mx-auto mb-2'></div>
									<div className={isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}>Chargement du graphique...</div>
								</div>
							</div>
						)}
					</div>
					{/* Conseils personnalisés */}
					<div className='mb-8'>
						<div className='flex justify-between items-center mb-4'>
							<div>
								<div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#343A40]'}`}>
									Conseils Personnalisés pour Vous
								</div>
								<div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
									Basés sur l'analyse de vos transactions et budgets
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<span className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
									{advice.length > 0 ? `${advice.length} conseil${advice.length > 1 ? 's' : ''}` : 'Analyse en cours'}
								</span>
							</div>
						</div>
						
						{advice.length > 0 ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
								{advice.map((adviceItem, index) => (
									<div
										key={index}
										className={`rounded-lg border p-6 flex flex-col gap-3 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : `bg-white ${getAdviceColor(adviceItem.type)}`}`}
									>
										<div className='flex items-start justify-between'>
											<div className={`font-bold mb-1 flex-1 ${isDarkMode ? 'text-white' : 'text-[#343A40]'}`}>
												{getAdviceIcon(adviceItem.type)} {adviceItem.title}
											</div>
											{adviceItem.priority && (
												<span className={`text-xs px-2 py-1 rounded-full ${
													adviceItem.priority === 'high' ? 'bg-[#495057] text-white' :
													adviceItem.priority === 'medium' ? 'bg-[#6C757D] text-white' :
													isDarkMode ? 'bg-[#383838] text-gray-300' : 'bg-gray-100 text-gray-600'
												}`}>
													{adviceItem.priority === 'high' ? 'Urgent' :
													 adviceItem.priority === 'medium' ? 'Important' : 'Info'}
												</span>
											)}
										</div>
										
										<div className={`text-sm mb-4 flex-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
											{adviceItem.description}
										</div>
										
										{/* Informations additionnelles selon le type de conseil */}
										{adviceItem.amount && (
											<div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-[#383838]' : 'text-gray-600 bg-white bg-opacity-50'}`}>
												Montant concerné: {formatAmount(adviceItem.amount)}
											</div>
										)}
										
										{adviceItem.category && (
											<div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-[#383838]' : 'text-gray-600 bg-white bg-opacity-50'}`}>
												Catégorie: {adviceItem.category}
											</div>
										)}
										
										{adviceItem.currentRate && adviceItem.targetRate && (
											<div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-[#383838]' : 'text-gray-600 bg-white bg-opacity-50'}`}>
												Taux actuel: {adviceItem.currentRate.toFixed(1)}% → Objectif: {adviceItem.targetRate}%
											</div>
										)}
										
										<button 
											className={`w-fit px-4 py-2 rounded font-semibold text-sm transition ${isDarkMode ? 'bg-[#383838] text-[#1E73BE] border border-[#404040] hover:bg-[#404040]' : 'bg-white bg-opacity-80 text-[#1E73BE] border border-white hover:bg-opacity-100'}`}
											onClick={() => {
												// Ici on pourrait ouvrir un modal avec plus de détails
												console.log('Détails conseil:', adviceItem);
											}}
										>
											Voir les détails
										</button>
									</div>
								))}
							</div>
						) : (
							<div className={`rounded-lg border p-8 text-center ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#F5F7FA]'}`}>
								<div className='text-4xl mb-4'>📊</div>
								<div className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#343A40]'}`}>Aucun conseil disponible</div>
								<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Ajoutez plus de transactions pour recevoir des conseils personnalisés basés sur vos habitudes financières.
								</div>
							</div>
						)}
					</div>
				</main>
				{/* Sidebar mobile (déconnexion) */}
				<aside className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#F5F7FA] p-4 flex justify-center'>
					<button className='bg-[#1E73BE] text-white px-6 py-2 rounded font-semibold hover:bg-[#155a8a] flex items-center gap-2'>
						<span className='text-lg'>⏻</span> Se déconnecter
					</button>
				</aside>
			</div>
			{/* Footer */}
			<Footer />
		</div>
	);
}
