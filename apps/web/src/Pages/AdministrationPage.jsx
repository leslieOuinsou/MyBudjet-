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
			<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
					<p className="text-[#64748B]">Chargement du tableau de bord admin...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-[#F8FAFC]">
			<AdminHeader />
			
			<div className="flex flex-1">
				<AdminSidebar />
				
				{/* Main */}
				<main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 flex flex-col pt-16 md:pt-10">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
						<div>
							<h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">
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
						<div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
							❌ {error}
						</div>
					)}
					{success && (
						<div className="mb-4 p-4 rounded-lg bg-[#DCFCE7] border border-[#16A34A] text-[#166534]">
							✅ {success}
						</div>
					)}
					
					{/* Statistiques Clés */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white border-[#E2E8F0]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B]">
									Total Utilisateurs
								</span>
								<MdPeople size={24} className="text-[#2563EB]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A]">
								{stats?.userCount || 0}
							</div>
							<span className="text-xs text-[#16A34A]">
								Utilisateurs inscrits
							</span>
						</div>
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white border-[#E2E8F0]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B]">
									Transactions
								</span>
								<MdAttachMoney size={24} className="text-[#16A34A]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A]">
								{stats?.txCount || 0}
							</div>
							<span className="text-xs text-[#64748B]">
								Transactions enregistrées
							</span>
						</div>
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white border-[#E2E8F0]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B]">
									Budgets Actifs
								</span>
								<MdAccountBalance size={24} className="text-[#2563EB]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A]">
								{stats?.budgetCount || 0}
							</div>
							<span className="text-xs text-[#16A34A]">
								Budgets créés
							</span>
						</div>
						<div className="rounded-xl shadow p-6 border flex flex-col gap-2 bg-white border-[#E2E8F0]">
							<div className="flex items-center justify-between">
								<span className="text-sm text-[#64748B]">
									Rappels de Factures
								</span>
								<MdNotifications size={24} className="text-[#64748B]" />
							</div>
							<div className="flex items-center gap-2 text-2xl font-bold text-[#0F172A]">
								{stats?.reminderCount || 0}
							</div>
							<span className="text-xs text-[#2563EB]">Rappels actifs</span>
						</div>
					</div>
					{/* Gestion des Utilisateurs */}
					<section className="rounded-xl shadow p-6 border mb-8 bg-white border-[#E2E8F0]">
						<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
							<div>
								<h2 className="text-xl font-bold text-[#0F172A]">
									Gestion des Utilisateurs ({filteredUsers.length})
								</h2>
								<p className="text-sm mt-1 text-[#64748B]">
									Gérez les comptes utilisateurs et leurs accès
								</p>
							</div>
							<div className="flex gap-3">
								<div className="relative">
									<MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
									<input
										type="text"
										placeholder="Rechercher..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 pr-4 py-2 rounded-lg border bg-white border-gray-300 text-black"
									/>
								</div>
							</div>
						</div>
						<div className="overflow-x-auto rounded-xl">
							<table className="min-w-full text-base">
								<thead>
									<tr className="bg-[#F8FAFC]">
										<th className="px-4 py-3 text-left font-bold text-[#0F172A]">
											NOM
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A]">
											EMAIL
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A]">
											RÔLE
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A]">
											STATUT
										</th>
										<th className="px-4 py-3 text-left font-bold text-[#0F172A]">
											ACTIONS
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredUsers.length > 0 ? (
										filteredUsers.map((user) => (
											<tr
												key={user._id}
												className="even:bg-white odd:bg-[#F8FAFC] hover:bg-gray-100"
											>
												<td className="px-4 py-3 font-medium text-black">{user.name}</td>
												<td className="px-4 py-3 text-gray-700">{user.email}</td>
												<td className="px-4 py-3 text-gray-700">
													<span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-[#1E3A8A] text-white' : 'bg-[#DBEAFE] text-[#1E3A8A]'}`}>
														{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
													</span>
												</td>
												<td className="px-4 py-3">
													<span
														className={`px-3 py-1 rounded-full text-xs font-bold ${
															user.blocked 
																? 'bg-[#64748B] text-white' 
																: 'bg-[#DCFCE7] text-[#166534]'
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
																className="flex items-center gap-1 text-[#16A34A] hover:text-[#15803D] text-sm"
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
															className="flex items-center gap-1 text-[#64748B] hover:text-[#334155] text-sm"
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
											<td colSpan="5" className="px-4 py-8 text-center text-[#64748B]">
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
						<div className="rounded-xl shadow p-6 border flex flex-col gap-3 bg-white border-[#E2E8F0]">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-[#DBEAFE] rounded-lg">
									<MdPeople size={24} className="text-[#2563EB]" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#0F172A]">
										Utilisateurs
									</h3>
									<p className="text-sm text-[#64748B]">
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
						
						<div className="rounded-xl shadow p-6 border flex flex-col gap-3 bg-white border-[#E2E8F0]">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-yellow-100 rounded-lg">
									<MdNotifications size={24} className="text-yellow-600" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#0F172A]">
										Rappels
									</h3>
									<p className="text-sm text-[#64748B]">
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
						
						<div className="rounded-xl shadow p-6 border flex flex-col gap-3 bg-white border-[#E2E8F0]">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-[#DCFCE7] rounded-lg">
									<MdAccountBalance size={24} className="text-[#16A34A]" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#0F172A]">
										Budgets
									</h3>
									<p className="text-sm text-[#64748B]">
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
