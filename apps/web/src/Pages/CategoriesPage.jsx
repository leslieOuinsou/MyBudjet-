import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import { getCategories, getWallets, addCategory, addWallet, updateCategory, updateWallet, deleteCategory, deleteWallet, recalculateWalletBalance, syncCategoriesFromTransactions } from '../api.js';
import { 
  MdAdd, MdEdit, MdDelete, MdCategory, MdAccountBalanceWallet,
  MdTrendingUp, MdTrendingDown, MdRefresh
} from 'react-icons/md';

// Définition des icônes de catégories
const categoryIcons = {
  '💳': '💳',
  '🍔': '🍔',
  '⛽': '⛽',
  '🏠': '🏠',
  '🚗': '🚗',
  '📱': '📱',
  '👕': '👕',
  '🎬': '🎬',
  '🏥': '🏥',
  '💰': '💰',
  '📊': '📊',
  '🎁': '🎁',
  '✈️': '✈️',
  '🎮': '🎮',
  '📚': '📚',
  '🏃': '🏃',
  '🍕': '🍕',
  '☕': '☕',
  '🛒': '🛒',
  '💊': '💊'
};

export default function CategoriesPage() {
	const [categories, setCategories] = useState([]);
	const [wallets, setWallets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	
	// Modal states
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showWalletModal, setShowWalletModal] = useState(false);
	const [editingCategory, setEditingCategory] = useState(null);
	const [editingWallet, setEditingWallet] = useState(null);
	
	// Form states
	const [newCategory, setNewCategory] = useState({
		name: '',
		type: 'expense',
		icon: '💳'
	});
	
	const [newWallet, setNewWallet] = useState({
		name: '',
		balance: '',
		overdraftLimit: '0',
		type: 'checking'
	});

	useEffect(() => {
		loadData();
	}, []);

	// Recharger les données quand on revient sur la page
	useEffect(() => {
		const handleFocus = () => {
			console.log('🔄 Focus détecté, rechargement des données...');
			loadData();
		};
		
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				console.log('🔄 Page visible, rechargement des données...');
				loadData();
			}
		};
		
		window.addEventListener('focus', handleFocus);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		return () => {
			window.removeEventListener('focus', handleFocus);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);
			setError('');
			
			const [categoriesData, walletsData] = await Promise.all([
				getCategories(),
				getWallets()
			]);
			
			setCategories(categoriesData || []);
			setWallets(walletsData || []);
		} catch (err) {
			setError(err.message || 'Erreur lors du chargement des données');
			setCategories([]);
			setWallets([]);
		} finally {
			setLoading(false);
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		try {
			if (editingCategory) {
				await updateCategory(editingCategory._id, newCategory);
			} else {
				await addCategory(newCategory);
			}
			setNewCategory({ name: '', type: 'expense', icon: '💳' });
			setShowCategoryModal(false);
			setEditingCategory(null);
			loadData();
		} catch (err) {
			setError('Erreur lors de la sauvegarde de la catégorie');
		}
	};

	const handleAddWallet = async (e) => {
		e.preventDefault();
		try {
			const walletData = {
				...newWallet,
				balance: parseFloat(newWallet.balance) || 0,
				overdraftLimit: parseFloat(newWallet.overdraftLimit) || 0
			};
			if (editingWallet) {
				await updateWallet(editingWallet._id, walletData);
			} else {
				await addWallet(walletData);
			}
			setNewWallet({ name: '', balance: '', overdraftLimit: '0', type: 'checking' });
			setShowWalletModal(false);
			setEditingWallet(null);
			loadData();
		} catch (err) {
			setError('Erreur lors de la sauvegarde du portefeuille');
		}
	};

	const handleEditCategory = (category) => {
		setEditingCategory(category);
		setNewCategory({
			name: category.name,
			type: category.type,
			icon: categoryIcons[category.name] || '💳'
		});
		setShowCategoryModal(true);
	};

	const handleEditWallet = (wallet) => {
		setEditingWallet(wallet);
		setNewWallet({
			name: wallet.name,
			balance: wallet.balance.toString(),
			overdraftLimit: (wallet.overdraftLimit || 0).toString(),
			type: wallet.type || 'checking'
		});
		setShowWalletModal(true);
	};

	const handleDeleteCategory = async (id) => {
		if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
			try {
				await deleteCategory(id);
				loadData();
			} catch (err) {
				setError('Erreur lors de la suppression de la catégorie');
			}
		}
	};

	const handleDeleteWallet = async (id) => {
		if (window.confirm('Êtes-vous sûr de vouloir supprimer ce portefeuille ?')) {
			try {
				await deleteWallet(id);
				loadData();
			} catch (err) {
				setError('Erreur lors de la suppression du portefeuille');
			}
		}
	};

	const handleRecalculateBalance = async (id) => {
		if (window.confirm('Recalculer le solde basé sur toutes les transactions ? Cette action remplacera le solde actuel.')) {
			try {
				setError('');
				const result = await recalculateWalletBalance(id);
				console.log('Résultat du recalcul:', result);
				alert(`Solde recalculé avec succès !\nAncien solde: ${result.oldBalance.toFixed(2)}€\nNouveau solde: ${result.newBalance.toFixed(2)}€`);
				loadData();
			} catch (err) {
				setError(err.message || 'Erreur lors du recalcul du solde');
				console.error('Erreur:', err);
			}
		}
	};

	const handleSyncCategories = async () => {
		try {
			setError('');
			const result = await syncCategoriesFromTransactions();
			console.log('Résultat de la synchronisation:', result);
			alert(`✅ Synchronisation réussie !\n${result.createdCount} nouvelle(s) catégorie(s) créée(s)`);
			loadData();
		} catch (err) {
			setError(err.message || 'Erreur lors de la synchronisation des catégories');
			console.error('Erreur:', err);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
									<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
					<p className="text-gray-500">Chargement des données...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col'>
			<DashboardHeader />
			<div className='flex flex-1'>
				<DashboardSidebar />
				{/* Main content */}
				<main className='flex-1 py-4 md:py-6 lg:py-10 px-3 md:px-6 lg:px-8 xl:px-12'>
					<div className='mb-4 md:mb-6 lg:mb-8'>
						<h1 className='text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2'>Gestion des Catégories & Portefeuilles</h1>
						<p className='text-sm md:text-base text-gray-600'>Organisez vos catégories et portefeuilles pour une meilleure gestion financière</p>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8'>
						{/* Catégories */}
						<section className='bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300'>
							<div className='flex justify-between items-center mb-4 md:mb-6'>
								<div className='flex items-center gap-2 md:gap-3'>
									<div className='w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#1E73BE] to-[#155a8a] rounded-lg md:rounded-xl flex items-center justify-center shadow-md'>
										<MdCategory size={20} className="text-white md:size-6" />
									</div>
									<h2 className='font-bold text-gray-900 text-lg md:text-xl'>
										Catégories
									</h2>
								</div>
							</div>

							<div className='flex gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap'>
								<button 
									onClick={handleSyncCategories}
									className='bg-gradient-to-r from-[#28A745] to-[#218838] text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold hover:from-[#218838] hover:to-[#1e7e34] text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
								>
									<MdRefresh size={16} className="md:size-[18px]" />
									<span className="hidden sm:inline">Synchroniser</span>
									<span className="sm:hidden">Sync</span>
								</button>
								<button 
									onClick={() => setShowCategoryModal(true)}
									className='bg-gradient-to-r from-[#1E73BE] to-[#155a8a] text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold hover:from-[#155a8a] hover:to-[#0d4a6f] text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
								>
									<MdAdd size={18} className="md:size-5" />
									<span className="hidden sm:inline">Ajouter</span>
									<span className="sm:hidden">Add</span>
								</button>
							</div>

							{error && (
								<div className="mb-4 p-3 bg-[#F8D7DA] border border-[#DC3545] rounded-lg text-[#721C24] text-sm">
									{error}
								</div>
							)}

							{loading ? (
								<div className="text-center py-12 text-gray-500">
									<div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-[#1E73BE] mx-auto mb-4"></div>
									<p className="font-medium">Chargement des catégories...</p>
								</div>
							) : categories.length === 0 ? (
								<div className="text-center py-12">
									<div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
										<MdCategory size={40} className="text-gray-400" />
									</div>
									<p className="font-semibold text-gray-900 mb-2">Aucune catégorie trouvée</p>
									<p className="text-sm text-gray-600">Créez votre première catégorie pour commencer</p>
								</div>
							) : (
								<div className='space-y-2 md:space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2'>
									{categories.map((cat) => (
										<div
											key={cat._id}
											className='flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 hover:shadow-md transition-all duration-200 border border-gray-100 group'
										>
											<div className='flex items-center gap-2 md:gap-3 flex-1 min-w-0'>
												<div 
													className='w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 flex-shrink-0' 
													style={{ backgroundColor: cat.color || '#1E73BE' }}
												>
													<CategoryIcon iconName={cat.icon} color="white" size={18} className="md:size-[22px]" />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='font-semibold text-gray-900 text-sm md:text-base truncate'>
														{cat.name}
													</div>
													<div className='flex items-center gap-2 mt-0.5'>
														{cat.type === 'income' ? (
															<span className='flex items-center gap-1 text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 bg-[#D4EDDA] text-[#155724] rounded md:rounded-lg'>
																<MdTrendingUp size={10} className="md:size-3" />
																Revenu
															</span>
														) : (
															<span className='flex items-center gap-1 text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 bg-[#F5F7FA] text-[#6C757D] rounded md:rounded-lg'>
																<MdTrendingDown size={10} className="md:size-3" />
																Dépense
															</span>
														)}
													</div>
												</div>
											</div>
											<div className='flex gap-0.5 md:gap-1 flex-shrink-0 ml-2'>
												<button
													onClick={() => handleEditCategory(cat)}
													className='text-[#1E73BE] hover:text-[#155a8a] p-1.5 md:p-2 rounded-lg hover:bg-[#E3F2FD] transition-all duration-200'
													title="Modifier"
												>
													<MdEdit size={18} className="md:size-5" />
												</button>
												<button
													onClick={() => handleDeleteCategory(cat._id)}
													className='text-[#6C757D] hover:text-[#495057] p-1.5 md:p-2 rounded-lg hover:bg-gray-50 transition-all duration-200'
													title="Supprimer"
												>
													<MdDelete size={18} className="md:size-5" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						{/* Portefeuilles */}
						<section className='bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300'>
							<div className='flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-2'>
								<div className='flex items-center gap-2 md:gap-3'>
									<div className='w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#1E73BE] to-[#155a8a] rounded-lg md:rounded-xl flex items-center justify-center shadow-md'>
										<MdAccountBalanceWallet size={20} className="text-white md:size-6" />
									</div>
									<h2 className='font-bold text-gray-900 text-lg md:text-xl'>
										Portefeuilles
									</h2>
								</div>
								<button 
									onClick={() => setShowWalletModal(true)}
									className='bg-gradient-to-r from-[#1E73BE] to-[#155a8a] text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold hover:from-[#155a8a] hover:to-[#0d4a6f] text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
								>
									<MdAdd size={18} className="md:size-5" />
									<span className="hidden sm:inline">Ajouter</span>
									<span className="sm:hidden">Add</span>
								</button>
							</div>

							{loading ? (
								<div className="text-center py-12 text-gray-500">
									<div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-[#1E73BE] mx-auto mb-4"></div>
									<p className="font-medium">Chargement des portefeuilles...</p>
								</div>
							) : wallets.length === 0 ? (
								<div className="text-center py-12">
									<div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
										<MdAccountBalanceWallet size={40} className="text-gray-400" />
									</div>
									<p className="font-semibold text-gray-900 mb-2">Aucun portefeuille trouvé</p>
									<p className="text-sm text-gray-600">Créez votre premier portefeuille pour commencer</p>
								</div>
							) : (
								<div className='space-y-2 md:space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2'>
									{wallets.map((w) => (
										<div
											key={w._id}
											className='flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 hover:shadow-md transition-all duration-200 border border-gray-100 group'
										>
											<div className='flex items-center gap-2 md:gap-3 flex-1 min-w-0'>
												<div className='w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#1E73BE] to-[#155a8a] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 flex-shrink-0'>
													<MdAccountBalanceWallet size={18} className="text-white md:size-[22px]" />
												</div>
												<div className='flex-1 min-w-0'>
													<div className='font-semibold text-gray-900 text-sm md:text-base truncate'>
														{w.name}
													</div>
													<div className={`text-sm md:text-base font-bold mt-1 ${w.balance >= 0 ? 'text-[#28A745]' : 'text-[#6C757D]'}`}>
														{w.balance !== undefined && w.balance !== null 
															? `${w.balance < 0 ? '-' : ''}${Math.abs(w.balance).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
															: '0,00 €'}
													</div>
													{w.overdraftLimit > 0 && (
														<div className='text-[10px] md:text-xs font-medium text-blue-600 mt-1 px-1.5 md:px-2 py-0.5 bg-blue-50 rounded md:rounded-lg inline-block'>
															Découvert: -{w.overdraftLimit.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
														</div>
													)}
												</div>
											</div>
											<div className='flex gap-0.5 md:gap-1 flex-shrink-0 ml-2'>
												<button
													onClick={() => handleRecalculateBalance(w._id)}
													className='text-[#28A745] hover:text-[#218838] p-1.5 md:p-2 rounded-lg hover:bg-[#D4EDDA] transition-all duration-200'
													title="Recalculer le solde"
												>
													<MdRefresh size={18} className="md:size-5" />
												</button>
												<button
													onClick={() => handleEditWallet(w)}
													className='text-[#1E73BE] hover:text-[#155a8a] p-1.5 md:p-2 rounded-lg hover:bg-[#E3F2FD] transition-all duration-200'
													title="Modifier"
												>
													<MdEdit size={18} className="md:size-5" />
												</button>
												<button
													onClick={() => handleDeleteWallet(w._id)}
													className='text-[#6C757D] hover:text-[#495057] p-1.5 md:p-2 rounded-lg hover:bg-gray-50 transition-all duration-200'
													title="Supprimer"
												>
													<MdDelete size={18} className="md:size-5" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</section>
					</div>
				</main>
			</div>

			{/* Footer */}
			<footer className='bg-white border-t border-gray-200 py-8 mt-auto'>
				<div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4'>
					<span className='text-blue-600 font-bold text-xl'>MyBudget+</span>
					<div className='flex gap-6 text-gray-500 text-sm'>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							Produit
						</a>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							Ressources
						</a>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							Légal
						</a>
					</div>
					<div className='flex gap-4 text-gray-500'>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							<i className='fab fa-facebook-f'></i>
						</a>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							<i className='fab fa-twitter'></i>
						</a>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							<i className='fab fa-linkedin-in'></i>
						</a>
						<a href='#' className='hover:text-blue-600 transition-colors'>
							<i className='fab fa-instagram'></i>
						</a>
					</div>
				</div>
				<div className='text-center text-xs text-gray-500 mt-4'>
					© 2024 MyBudget+. Tous droits réservés.
				</div>
			</footer>

					{/* Modal Ajouter/Modifier Catégorie */}
		{showCategoryModal && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
					<div className="bg-gradient-to-r from-[#1E73BE] to-[#155a8a] px-6 py-4 rounded-t-2xl flex justify-between items-center">
						<h3 className="text-xl font-bold text-white">
							{editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
						</h3>
						<button 
							onClick={() => {
								setShowCategoryModal(false);
								setEditingCategory(null);
								setNewCategory({ name: '', type: 'expense', icon: '💳' });
							}}
							className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
						>
							✕
						</button>
										</div>
					<div className="p-6">
						<form onSubmit={handleAddCategory} className="space-y-5">
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">Nom de la catégorie</label>
								<input
									type="text"
									value={newCategory.name}
									onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1E73BE] transition-colors"
									placeholder="Ex: Nourriture"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">Type</label>
								<select
									value={newCategory.type}
									onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1E73BE] transition-colors"
								>
									<option value="expense">Dépense</option>
									<option value="income">Revenu</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-3">Icône</label>
								<div className="grid grid-cols-5 gap-2">
									{Object.entries(categoryIcons).map(([name, icon]) => (
										<button
											key={name}
											type="button"
											onClick={() => setNewCategory({...newCategory, icon})}
											className={`p-3 rounded-xl border-2 text-2xl hover:scale-110 transition-all duration-200 ${
												newCategory.icon === icon 
													? 'border-[#1E73BE] bg-[#E3F2FD] shadow-md' 
													: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
											}`}
										>
											{icon}
										</button>
									))}
								</div>
							</div>
							<div className="flex gap-3 pt-4">
								<button
									type="button"
									onClick={() => {
										setShowCategoryModal(false);
										setEditingCategory(null);
										setNewCategory({ name: '', type: 'expense', icon: '💳' });
									}}
									className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
								>
									Annuler
								</button>
								<button
									type="submit"
									className="flex-1 bg-gradient-to-r from-[#1E73BE] to-[#155a8a] text-white py-3 rounded-xl font-semibold hover:from-[#155a8a] hover:to-[#0d4a6f] transition-all shadow-md hover:shadow-lg"
								>
									{editingCategory ? 'Modifier' : 'Ajouter'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		)}

					{/* Modal Ajouter/Modifier Portefeuille */}
		{showWalletModal && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
					<div className="bg-gradient-to-r from-[#1E73BE] to-[#155a8a] px-6 py-4 rounded-t-2xl flex justify-between items-center">
						<h3 className="text-xl font-bold text-white">
							{editingWallet ? 'Modifier le Portefeuille' : 'Ajouter un Portefeuille'}
						</h3>
						<button 
							onClick={() => {
								setShowWalletModal(false);
								setEditingWallet(null);
								setNewWallet({ name: '', balance: '', overdraftLimit: '0', type: 'checking' });
							}}
							className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
						>
							✕
						</button>
					</div>
					<div className="p-6">
						<form onSubmit={handleAddWallet} className="space-y-5">
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">Nom du portefeuille</label>
								<input
									type="text"
									value={newWallet.name}
									onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1E73BE] transition-colors"
									placeholder="Ex: Compte Courant"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">Solde initial (€)</label>
								<input
									type="number"
									step="0.01"
									value={newWallet.balance}
									onChange={(e) => setNewWallet({...newWallet, balance: e.target.value})}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1E73BE] transition-colors"
									placeholder="0.00"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">Découvert autorisé (€)</label>
								<input
									type="number"
									step="0.01"
									min="0"
									value={newWallet.overdraftLimit}
									onChange={(e) => setNewWallet({...newWallet, overdraftLimit: e.target.value})}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1E73BE] transition-colors"
									placeholder="Ex: 1000"
								/>
								<p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">💡 Exemple: 1000€ = solde peut descendre jusqu'à -1000€</p>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">Type</label>
								<select
									value={newWallet.type}
									onChange={(e) => setNewWallet({...newWallet, type: e.target.value})}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1E73BE] transition-colors"
								>
									<option value="checking">Compte Courant</option>
									<option value="savings">Épargne</option>
									<option value="credit">Carte de Crédit</option>
									<option value="cash">Espèces</option>
									<option value="investment">Investissement</option>
								</select>
							</div>
							<div className="flex gap-3 pt-4">
								<button
									type="button"
									onClick={() => {
										setShowWalletModal(false);
										setEditingWallet(null);
										setNewWallet({ name: '', balance: '', overdraftLimit: '0', type: 'checking' });
									}}
									className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
								>
									Annuler
								</button>
								<button
									type="submit"
									className="flex-1 bg-gradient-to-r from-[#1E73BE] to-[#155a8a] text-white py-3 rounded-xl font-semibold hover:from-[#155a8a] hover:to-[#0d4a6f] transition-all shadow-md hover:shadow-lg"
								>
									{editingWallet ? 'Modifier' : 'Ajouter'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		)}
		</div>
	);
}
