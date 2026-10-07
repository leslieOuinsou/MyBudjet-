import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
			<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
					<p className="text-[#64748B] dark:text-[#94A3B8]">Chargement du tableau de bord admin...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A]">
			<AdminHeader />
			
			<div className="flex flex-1">
				<AdminSidebar />
				
				{/* Main */}
				<main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 flex flex-col pt-16 md:pt-10">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
						<div>
							<h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
								Tableau de Bord Administration
							</h1>
							<div className="text-xs mt-2 flex items-center gap-2 text-gray-400">
								<span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse"></span>
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
						<div className="mb-4 p-4 rounded-lg bg-red-100 dark:bg-[#7F1D1D]/50 border border-red-300 dark:border-[#991B1B] text-red-700 dark:text-[#FCA5A5]">
							❌ {error}
						</div>
					)}
					{success && (
						<div className="mb-4 p-4 rounded-lg bg-[#DCFCE7] dark:bg-[#14532D]/50 border border-[#16A34A] text-[#166534] dark:text-[#86EFAC]">
							✅ {success}
						</div>
					)}
					
					{/* Statistiques Clés */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
									Total Utilisateurs
								</span>
								<MdPeople size={24} className="text-[#2563EB] dark:text-[#60A5FA]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
								{stats?.userCount || 0}
							</div>
							<span className="text-xs text-[#16A34A] dark:text-[#22C55E]">
								Utilisateurs inscrits
							</span>
						</div>
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
									Transactions
								</span>
								<MdAttachMoney size={24} className="text-[#16A34A] dark:text-[#22C55E]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
								{stats?.txCount || 0}
							</div>
							<span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
								Transactions enregistrées
							</span>
						</div>
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
									Budgets Actifs
								</span>
								<MdAccountBalance size={24} className="text-[#2563EB] dark:text-[#60A5FA]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
								{stats?.budgetCount || 0}
							</div>
							<span className="text-xs text-[#16A34A] dark:text-[#22C55E]">
								Budgets créés
							</span>
						</div>
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
									Rappels de Factures
								</span>
								<MdNotifications size={24} className="text-[#64748B] dark:text-[#94A3B8]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
								{stats?.reminderCount || 0}
							</div>
							<span className="text-xs text-[#2563EB] dark:text-[#60A5FA]">Rappels actifs</span>
						</div>
					</div>
					{/* Gestion des Utilisateurs */}
					<section className="rounded-xl shadow p-6 border mb-8 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
						<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
							<div>
								<h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
									Gestion des Utilisateurs ({filteredUsers.length})
								</h2>
								<p className="text-sm mt-1 text-[#64748B] dark:text-[#94A3B8]">
									Gérez les comptes utilisateurs et leurs accès
								</p>
							</div>
							<div className="flex gap-3">
								<div className="relative">
									<MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-[#94A3B8]" size={20} />
									<input
										type="text"
										placeholder="Rechercher..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]"
									/>
								</div>
							</div>
						</div>
						<div className="overflow-x-auto rounded-xl">
							<table className="min-w-full text-base">
								<thead>
									<tr className="bg-[#F8FAFC] dark:bg-[#334155]/50">
										<th className="px-4 py-3 text-left font-bold text-[#0F172A] dark:text-[#F8FAFC]">
											NOM
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A] dark:text-[#F8FAFC]">
											EMAIL
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A] dark:text-[#F8FAFC]">
											RÔLE
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A] dark:text-[#F8FAFC]">
											STATUT
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A] dark:text-[#F8FAFC]">
											ACTIONS
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredUsers.length > 0 ? (
										filteredUsers.map((user) => (
											<tr
												key={user._id}
												className="even:bg-white dark:even:bg-[#1E293B] odd:bg-[#F8FAFC] dark:odd:bg-[#334155]/50 hover:bg-gray-100 dark:hover:bg-[#334155]"
											>
												<td className="px-4 py-3 font-medium text-black dark:text-[#F8FAFC]">{user.name}</td>
												<td className="px-4 py-3 text-gray-700 dark:text-[#E2E8F0]">{user.email}</td>
												<td className="px-4 py-3 text-gray-700 dark:text-[#E2E8F0]">
													<span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-[#1E3A8A] text-white' : 'bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#1E3A8A] dark:text-[#BFDBFE]'}`}>
														{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
													</span>
												</td>
												<td className="px-4 py-3">
													<span
														className={`px-3 py-1 rounded-full text-xs font-bold ${
															user.blocked 
																? 'bg-[#64748B] text-white' 
																: 'bg-[#DCFCE7] dark:bg-[#14532D]/50 text-[#166534] dark:text-[#86EFAC]'
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
																className="flex items-center gap-1 text-[#16A34A] dark:text-[#22C55E] hover:text-[#15803D] dark:hover:text-[#4ADE80] text-sm"
																title="Débloquer"
															>
																<MdCheckCircle size={18} />
																Débloquer
															</button>
														) : (
															<button 
																onClick={() => handleBlockUser(user._id)}
																className="flex items-center gap-1 text-orange-600 dark:text-[#FBBF24] hover:text-orange-800 dark:hover:text-[#FDBA74] text-sm"
																title="Bloquer"
															>
																<MdBlock size={18} />
																Bloquer
															</button>
														)}
														<button 
															onClick={() => handleDeleteUser(user._id)}
															className="flex items-center gap-1 text-[#64748B] dark:text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#E2E8F0] text-sm"
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
											<td colSpan="5" className="px-4 py-8 text-center text-[#64748B] dark:text-[#94A3B8]">
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
						<div className="rounded-xl shadow p-6 border flex flex-col gap-3 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-[#DBEAFE] dark:bg-[#1E40AF] rounded-lg">
									<MdPeople size={24} className="text-[#2563EB] dark:text-[#60A5FA]" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
										Utilisateurs
									</h3>
									<p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
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
						
						<div className="rounded-xl shadow p-6 border flex flex-col gap-3 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-yellow-100 dark:bg-[#78350F]/50 rounded-lg">
									<MdNotifications size={24} className="text-yellow-600 dark:text-[#FBBF24]" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
										Rappels
									</h3>
									<p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
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
						
						<div className="rounded-xl shadow p-6 border flex flex-col gap-3 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-[#DCFCE7] dark:bg-[#14532D]/50 rounded-lg">
									<MdAccountBalance size={24} className="text-[#16A34A] dark:text-[#22C55E]" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
										Budgets
									</h3>
									<p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
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
