import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { 
  getAdminStats, 
  getAllUsers, 
  blockUser, 
  unblockUser, 
  deleteUserAdmin 
} from '../api.js';
import { 
  MdPeople, 
  MdAttachMoney, 
  MdAccountBalance, 
  MdNotifications,
  MdBlock,
  MdCheckCircle,
  MdDelete,
  MdEdit,
  MdSearch,
  MdAdd,
  MdRefresh
} from 'react-icons/md';

export default function AdministrationPage() {
	const { isDarkMode } = useTheme();
	
	// États pour les données
	const [users, setUsers] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [lastRefresh, setLastRefresh] = useState(new Date());
	
	// Charger les données au montage
	useEffect(() => {
		loadAdminData();
		
		// Auto-refresh toutes les 30 secondes
		const interval = setInterval(() => {
			console.log('🔄 Auto-refresh du tableau de bord admin...');
			loadAdminData();
		}, 30000);
		
		return () => clearInterval(interval);
	}, []);
	
	const loadAdminData = async () => {
		try {
			setLoading(true);
			setError('');
			
			console.log('📊 Chargement des données admin...');
			
			const [statsData, usersData] = await Promise.all([
				getAdminStats(),
				getAllUsers()
			]);
			
			console.log('📈 Stats reçues:', statsData);
			console.log('👥 Utilisateurs reçus:', usersData);
			
			setStats(statsData);
			setUsers(usersData);
			setLastRefresh(new Date());
			
			console.log('✅ Données admin chargées avec succès');
		} catch (err) {
			console.error('❌ Erreur chargement admin:', err);
			setError(err.message || 'Erreur lors du chargement des données');
		} finally {
			setLoading(false);
		}
	};
	
	const handleBlockUser = async (userId) => {
		try {
			await blockUser(userId);
			setSuccess('Utilisateur bloqué avec succès');
			loadAdminData(); // Recharger la liste
			setTimeout(() => setSuccess(''), 3000);
		} catch (err) {
			setError(err.message);
		}
	};
	
	const handleUnblockUser = async (userId) => {
		try {
			await unblockUser(userId);
			setSuccess('Utilisateur débloqué avec succès');
			loadAdminData();
			setTimeout(() => setSuccess(''), 3000);
		} catch (err) {
			setError(err.message);
		}
	};
	
	const handleDeleteUser = async (userId) => {
		if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
			return;
		}
		
		try {
			await deleteUserAdmin(userId);
			setSuccess('Utilisateur supprimé avec succès');
			loadAdminData();
			setTimeout(() => setSuccess(''), 3000);
		} catch (err) {
			setError(err.message);
		}
	};
	
	// Filtrer les utilisateurs par recherche
	const filteredUsers = users.filter(user => 
		user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.role?.toLowerCase().includes(searchTerm.toLowerCase())
	);
	
	if (loading) {
		return (
			<div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
					<p className={isDarkMode ? 'text-gray-300' : 'text-[#6C757D]'}>Chargement du tableau de bord admin...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
			<AdminHeader />
			
			<div className="flex flex-1">
				<AdminSidebar />
				
				{/* Main */}
				<main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 flex flex-col pt-16 md:pt-10">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
						<div>
							<h1 className={`text-2xl md:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
								Tableau de Bord Administration
							</h1>
							<div className={`text-xs mt-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
								<span className="w-2 h-2 bg-[#28A745] rounded-full animate-pulse"></span>
								Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
								<span className="mx-2">•</span>
								Auto-refresh : 30s
							</div>
						</div>
						<button 
							onClick={loadAdminData}
							className="flex items-center gap-2 bg-[#1E3A8A] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition"
							disabled={loading}
						>
							<MdRefresh size={20} />
							Actualiser
						</button>
					</div>
					
					{/* Messages d'erreur et de succès */}
					{error && (
						<div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 border border-red-300 text-red-700'}`}>
							❌ {error}
						</div>
					)}
					{success && (
						<div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-[#D4EDDA] border border-[#28A745] text-[#155724]'}`}>
							✅ {success}
						</div>
					)}
					
					{/* Statistiques Clés */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center justify-between">
								<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Total Utilisateurs
								</span>
								<MdPeople size={24} className="text-[#1E73BE]" />
							</div>
							<div className={`flex items-center gap-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
								{stats?.userCount || 0}
							</div>
							<span className="text-xs text-[#28A745]">
								Utilisateurs inscrits
							</span>
						</div>
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center justify-between">
								<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Transactions
								</span>
								<MdAttachMoney size={24} className="text-[#28A745]" />
							</div>
							<div className={`flex items-center gap-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
								{stats?.txCount || 0}
							</div>
							<span className="text-xs text-[#6C757D]">
								Transactions enregistrées
							</span>
						</div>
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center justify-between">
								<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Budgets Actifs
								</span>
								<MdAccountBalance size={24} className="text-[#1E73BE]" />
							</div>
							<div className={`flex items-center gap-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
								{stats?.budgetCount || 0}
							</div>
							<span className="text-xs text-[#28A745]">
								Budgets créés
							</span>
						</div>
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-2 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center justify-between">
								<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Rappels de Factures
								</span>
								<MdNotifications size={24} className="text-[#6C757D]" />
							</div>
							<div className={`flex items-center gap-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
								{stats?.reminderCount || 0}
							</div>
							<span className="text-xs text-[#1E73BE]">Rappels actifs</span>
						</div>
					</div>
					{/* Gestion des Utilisateurs */}
					<section className={`rounded-xl shadow p-6 border mb-8 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
						<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
							<div>
								<h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
									Gestion des Utilisateurs ({filteredUsers.length})
								</h2>
								<p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
									Gérez les comptes utilisateurs et leurs accès
								</p>
							</div>
							<div className="flex gap-3">
								<div className="relative">
									<MdSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
									<input
										type="text"
										placeholder="Rechercher..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className={`pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
									/>
								</div>
							</div>
						</div>
						<div className="overflow-x-auto rounded-xl">
							<table className="min-w-full text-base">
								<thead>
									<tr className={isDarkMode ? 'bg-[#383838]' : 'bg-[#F5F7FA]'}>
										<th className={`px-4 py-3 text-left font-bold ${isDarkMode ? 'text-gray-300' : 'text-[#343A40]'}`}>
											NOM
										</th>
										<th className={`px-4 py-3 text-left font-bold ${isDarkMode ? 'text-gray-300' : 'text-[#343A40]'}`}>
											EMAIL
										</th>
										<th className={`px-4 py-3 text-left font-bold ${isDarkMode ? 'text-gray-300' : 'text-[#343A40]'}`}>
											RÔLE
										</th>
										<th className={`px-4 py-3 text-left font-bold ${isDarkMode ? 'text-gray-300' : 'text-[#343A40]'}`}>
											STATUT
										</th>
										<th className={`px-4 py-3 text-left font-bold ${isDarkMode ? 'text-gray-300' : 'text-[#343A40]'}`}>
											ACTIONS
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredUsers.length > 0 ? (
										filteredUsers.map((user) => (
											<tr
												key={user._id}
												className={isDarkMode ? 'even:bg-[#2d2d2d] odd:bg-[#383838] hover:bg-[#404040]' : 'even:bg-white odd:bg-[#F5F7FA] hover:bg-gray-100'}
											>
												<td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{user.name}</td>
												<td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.email}</td>
												<td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
													<span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-[#1E3A8A] text-white' : 'bg-[#E3F2FD] text-[#1E3A8A]'}`}>
														{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
													</span>
												</td>
												<td className="px-4 py-3">
													<span
														className={`px-3 py-1 rounded-full text-xs font-bold ${
															user.blocked 
																? 'bg-[#6C757D] text-white' 
																: 'bg-[#D4EDDA] text-[#155724]'
														}`}
													>
														{user.blocked ? 'Bloqué' : 'Actif'}
													</span>
												</td>
												<td className="px-4 py-3">
													<div className="flex gap-2">
														{user.blocked ? (
															<button 
																onClick={() => handleUnblockUser(user._id)}
																className="flex items-center gap-1 text-[#28A745] hover:text-[#218838] text-sm"
																title="Débloquer"
															>
																<MdCheckCircle size={18} />
																Débloquer
															</button>
														) : (
															<button 
																onClick={() => handleBlockUser(user._id)}
																className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-sm"
																title="Bloquer"
															>
																<MdBlock size={18} />
																Bloquer
															</button>
														)}
														<button 
															onClick={() => handleDeleteUser(user._id)}
															className="flex items-center gap-1 text-[#6C757D] hover:text-[#495057] text-sm"
															title="Supprimer"
														>
															<MdDelete size={18} />
															Supprimer
														</button>
													</div>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan="5" className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
												{searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</section>
					{/* Actions Rapides */}
					<section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-3 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center gap-3">
								<div className="p-3 bg-[#E3F2FD] rounded-lg">
									<MdPeople size={24} className="text-[#1E73BE]" />
								</div>
								<div>
									<h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
										Utilisateurs
									</h3>
									<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
										{stats?.userCount || 0} comptes
									</p>
								</div>
							</div>
							<Link 
								to="/admin/users"
								className="bg-[#1E3A8A] text-white text-center px-4 py-2 rounded-lg font-semibold hover:bg-[#1e40af] transition"
							>
								Gérer les utilisateurs
							</Link>
						</div>
						
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-3 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center gap-3">
								<div className="p-3 bg-yellow-100 rounded-lg">
									<MdNotifications size={24} className="text-yellow-600" />
								</div>
								<div>
									<h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
										Rappels
									</h3>
									<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
										{stats?.reminderCount || 0} rappels
									</p>
								</div>
							</div>
							<Link 
								to="/admin/billreminders"
								className="bg-[#1E3A8A] text-white text-center px-4 py-2 rounded-lg font-semibold hover:bg-[#1e40af] transition"
							>
								Gérer les rappels
							</Link>
						</div>
						
						<div className={`rounded-xl shadow p-6 border flex flex-col gap-3 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-[#EAF4FB]'}`}>
							<div className="flex items-center gap-3">
								<div className="p-3 bg-[#D4EDDA] rounded-lg">
									<MdAccountBalance size={24} className="text-[#28A745]" />
								</div>
								<div>
									<h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
										Budgets
									</h3>
									<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
										{stats?.budgetCount || 0} budgets
									</p>
								</div>
							</div>
							<button 
								className="bg-[#1E3A8A] text-white text-center px-4 py-2 rounded-lg font-semibold hover:bg-[#1e40af] transition"
								onClick={() => window.location.href = '/budgets'}
							>
								Voir les budgets
							</button>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}
