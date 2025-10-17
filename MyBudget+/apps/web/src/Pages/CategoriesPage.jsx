import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import { getCategories, getWallets, addCategory, addWallet, updateCategory, updateWallet, deleteCategory, deleteWallet } from '../api.js';
import { 
  MdAdd, MdEdit, MdDelete, MdCategory, MdAccountBalanceWallet,
  MdTrendingUp, MdTrendingDown
} from 'react-icons/md';

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
		type: 'checking'
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);
			const [categoriesData, walletsData] = await Promise.all([
				getCategories(),
				getWallets()
			]);
			setCategories(categoriesData);
			setWallets(walletsData);
		} catch (err) {
			setError(err.message || 'Erreur lors du chargement des données');
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
				balance: parseFloat(newWallet.balance) || 0
			};
			if (editingWallet) {
				await updateWallet(editingWallet._id, walletData);
			} else {
				await addWallet(walletData);
			}
			setNewWallet({ name: '', balance: '', type: 'checking' });
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

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
					<p className="text-[#6C757D]">Chargement des données...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-100 flex flex-col'>
			<DashboardHeader />
			<div className='flex flex-1'>
				{/* Sidebar */}
				<aside className='w-64 bg-white border-r border-[#F5F7FA] py-8 px-6 hidden md:block'>
					<div className='mb-8'>
						<div className='text-xs text-[#6C757D] font-semibold mb-2'>
							NAVIGATION
						</div>
						<ul className='space-y-2'>
							<li>
								<Link
									to='/dashboard'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Tableau de bord
								</Link>
							</li>
							<li>
								<Link
									to='/categories'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Catégories & Portefeuilles
								</Link>
							</li>
							<li>
								<Link
									to='/budgets'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Budgets
								</Link>
							</li>
							<li>
								<Link
									to='/transactions'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Transactions
								</Link>
							</li>
							<li>
								<Link
									to='/reports'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Rapports
								</Link>
							</li>
							<li>
								<Link
									to='/importexport'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Import/Export
								</Link>
							</li>
							<li>
								<Link
									to='/forecasts'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Prévisions
								</Link>
							</li>
							<li>
								<Link
									to='/notifications'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Notifications
								</Link>
							</li>
							<li>
								<Link
									to='/settings'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Paramètres utilisateur
								</Link>
							</li>
							<li>
								<Link
									to='/profile'
									className='block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]'
								>
									Mon Profil
								</Link>
							</li>
						</ul>
					</div>
					<Link
						to='/login'
						className='mt-8 w-full bg-[#DC3545] text-white px-6 py-2 rounded font-semibold hover:bg-[#b52a37] flex items-center gap-2'
					>
						<span className='text-lg'>⏻</span> Déconnexion
					</Link>
				</aside>
				{/* Main content */}
				<main className='flex-1 py-10 px-4 md:px-12'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
						{/* Catégories */}
						<section className='bg-white rounded-lg border border-[#F5F7FA] p-6'>
							<div className='flex justify-between items-center mb-4'>
								<h2 className='font-semibold text-[#343A40] text-lg'>
									Gestion des Catégories
								</h2>
								<button 
									onClick={() => setShowCategoryModal(true)}
									className='bg-[#1E73BE] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#155a8a] text-sm flex items-center gap-2 transition-colors shadow-sm'
								>
									<MdAdd size={20} />
									Ajouter une Catégorie
								</button>
							</div>
							{error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
							<hr className='mb-4 border-[#F5F7FA]' />
							{loading ? (
								<div className="text-center py-8 text-[#6C757D]">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E73BE] mx-auto mb-3"></div>
									Chargement des catégories...
								</div>
							) : categories.length === 0 ? (
								<div className="text-center py-8 text-[#6C757D]">
									<MdCategory size={48} className="mx-auto mb-3 opacity-30" />
									<p className="font-medium">Aucune catégorie trouvée</p>
									<p className="text-sm mt-2">Cliquez sur "Ajouter une Catégorie" pour créer votre première catégorie</p>
								</div>
							) : (
							<ul className='space-y-3'>
								{categories.map((cat) => (
									<li
										key={cat._id}
										className='flex items-center justify-between bg-[#F5F7FA] rounded-lg px-4 py-3 hover:bg-[#EAF4FB] transition-colors'
									>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-lg flex items-center justify-center' style={{ backgroundColor: cat.color || '#1E73BE' }}>
												<CategoryIcon iconName={cat.icon} color="white" size={20} />
											</div>
											<div>
												<div className='font-medium text-[#343A40]'>
													{cat.name}
												</div>
												<div className='flex items-center gap-2 mt-1'>
													{cat.type === 'income' ? (
														<span className='flex items-center gap-1 text-xs text-[#28A745]'>
															<MdTrendingUp size={14} />
															Revenu
														</span>
													) : (
														<span className='flex items-center gap-1 text-xs text-[#DC3545]'>
															<MdTrendingDown size={14} />
															Dépense
														</span>
													)}
												</div>
											</div>
										</div>
										<div className='flex gap-2'>
											<button
												onClick={() => handleEditCategory(cat)}
												className='text-[#1E73BE] hover:text-[#155a8a] p-2 rounded hover:bg-white transition-colors'
												title="Modifier"
											>
												<MdEdit size={20} />
											</button>
											<button
												onClick={() => handleDeleteCategory(cat._id)}
												className='text-[#DC3545] hover:text-[#b52a37] p-2 rounded hover:bg-white transition-colors'
												title="Supprimer"
											>
												<MdDelete size={20} />
											</button>
										</div>
									</li>
								))}
							</ul>
							)}
						</section>
						{/* Portefeuilles */}
						<section className='bg-white rounded-lg border border-[#F5F7FA] p-6'>
							<div className='flex justify-between items-center mb-4'>
								<h2 className='font-semibold text-[#343A40] text-lg'>
									Gestion des Portefeuilles
								</h2>
								<button 
									onClick={() => setShowWalletModal(true)}
									className='bg-[#1E73BE] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#155a8a] text-sm flex items-center gap-2 transition-colors shadow-sm'
								>
									<MdAdd size={20} />
									Ajouter un Portefeuille
								</button>
							</div>
							<hr className='mb-4 border-[#F5F7FA]' />
							{loading ? (
								<div className="text-center py-8 text-[#6C757D]">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E73BE] mx-auto mb-3"></div>
									Chargement des portefeuilles...
								</div>
							) : wallets.length === 0 ? (
								<div className="text-center py-8 text-[#6C757D]">
									<MdAccountBalanceWallet size={48} className="mx-auto mb-3 opacity-30" />
									<p className="font-medium">Aucun portefeuille trouvé</p>
									<p className="text-sm mt-2">Cliquez sur "Ajouter un Portefeuille" pour créer votre premier portefeuille</p>
								</div>
							) : (
							<ul className='space-y-3'>
								{wallets.map((w) => (
									<li
										key={w._id}
										className='flex items-center justify-between bg-[#F5F7FA] rounded-lg px-4 py-3 hover:bg-[#EAF4FB] transition-colors'
									>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E73BE] to-[#155a8a] flex items-center justify-center'>
												<MdAccountBalanceWallet size={20} className="text-white" />
											</div>
											<div>
												<div className='font-medium text-[#343A40]'>
													{w.name}
												</div>
												<div className={`text-sm font-semibold mt-1 ${w.balance >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
													{w.balance?.toLocaleString('fr-FR', {
														style: 'currency',
														currency: 'EUR',
													}) || '0,00 €'}
												</div>
											</div>
										</div>
										<div className='flex gap-2'>
											<button
												onClick={() => handleEditWallet(w)}
												className='text-[#1E73BE] hover:text-[#155a8a] p-2 rounded hover:bg-white transition-colors'
												title="Modifier"
											>
												<MdEdit size={20} />
											</button>
											<button
												onClick={() => handleDeleteWallet(w._id)}
												className='text-[#DC3545] hover:text-[#b52a37] p-2 rounded hover:bg-white transition-colors'
												title="Supprimer"
											>
												<MdDelete size={20} />
											</button>
										</div>
									</li>
								))}
							</ul>
							)}
						</section>
					</div>
				</main>
			</div>
			{/* Footer */}
			<footer className='bg-white border-t border-[#F5F7FA] py-8 mt-auto'>
				<div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4'>
					<span className='text-[#1E73BE] font-bold text-xl'>MyBudget+</span>
					<div className='flex gap-6 text-[#6C757D] text-sm'>
						<a href='#' className='hover:text-[#1E73BE]'>
							Produit
						</a>
						<a href='#' className='hover:text-[#1E73BE]'>
							Ressources
						</a>
						<a href='#' className='hover:text-[#1E73BE]'>
							Légal
						</a>
					</div>
					<div className='flex gap-4 text-[#6C757D]'>
						<a href='#'>
							<i className='fab fa-facebook-f'></i>
						</a>
						<a href='#'>
							<i className='fab fa-twitter'></i>
						</a>
						<a href='#'>
							<i className='fab fa-linkedin-in'></i>
						</a>
						<a href='#'>
							<i className='fab fa-instagram'></i>
						</a>
					</div>
				</div>
				<div className='text-center text-xs text-[#6C757D] mt-4'>
					© 2024 MyBudget+. Tous droits réservés.
				</div>
			</footer>

			{/* Modal Ajouter/Modifier Catégorie */}
			{showCategoryModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-[#343A40]">
								{editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
							</h3>
							<button 
								onClick={() => {
									setShowCategoryModal(false);
									setEditingCategory(null);
									setNewCategory({ name: '', type: 'expense', icon: '💳' });
								}}
								className="text-[#6C757D] hover:text-[#343A40]"
							>
								✕
							</button>
						</div>
						<form onSubmit={handleAddCategory} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-[#343A40] mb-1">Nom de la catégorie</label>
								<input
									type="text"
									value={newCategory.name}
									onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
									className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
									placeholder="Ex: Nourriture"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-[#343A40] mb-1">Type</label>
								<select
									value={newCategory.type}
									onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
									className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
								>
									<option value="expense">Dépense</option>
									<option value="income">Revenu</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-[#343A40] mb-1">Icône</label>
								<div className="grid grid-cols-5 gap-2">
									{Object.entries(categoryIcons).map(([name, icon]) => (
										<button
											key={name}
											type="button"
											onClick={() => setNewCategory({...newCategory, icon})}
											className={`p-2 rounded border text-xl hover:bg-[#F5F7FA] ${
												newCategory.icon === icon ? 'border-[#1E73BE] bg-[#F5F7FA]' : 'border-[#F5F7FA]'
											}`}
										>
											{icon}
										</button>
									))}
								</div>
							</div>
							<div className="flex gap-2 pt-4">
								<button
									type="button"
									onClick={() => {
										setShowCategoryModal(false);
										setEditingCategory(null);
										setNewCategory({ name: '', type: 'expense', icon: '💳' });
									}}
									className="flex-1 bg-[#F5F7FA] text-[#343A40] py-2 rounded hover:bg-gray-200"
								>
									Annuler
								</button>
								<button
									type="submit"
									className="flex-1 bg-[#1E73BE] text-white py-2 rounded hover:bg-[#155a8a]"
								>
									{editingCategory ? 'Modifier' : 'Ajouter'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal Ajouter/Modifier Portefeuille */}
			{showWalletModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-[#343A40]">
								{editingWallet ? 'Modifier le Portefeuille' : 'Ajouter un Portefeuille'}
							</h3>
							<button 
								onClick={() => {
									setShowWalletModal(false);
									setEditingWallet(null);
									setNewWallet({ name: '', balance: '', type: 'checking' });
								}}
								className="text-[#6C757D] hover:text-[#343A40]"
							>
								✕
							</button>
						</div>
						<form onSubmit={handleAddWallet} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-[#343A40] mb-1">Nom du portefeuille</label>
								<input
									type="text"
									value={newWallet.name}
									onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
									className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
									placeholder="Ex: Compte Courant"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-[#343A40] mb-1">Solde initial (€)</label>
								<input
									type="number"
									step="0.01"
									value={newWallet.balance}
									onChange={(e) => setNewWallet({...newWallet, balance: e.target.value})}
									className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
									placeholder="0.00"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-[#343A40] mb-1">Type</label>
								<select
									value={newWallet.type}
									onChange={(e) => setNewWallet({...newWallet, type: e.target.value})}
									className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
								>
									<option value="checking">Compte Courant</option>
									<option value="savings">Épargne</option>
									<option value="credit">Carte de Crédit</option>
									<option value="cash">Espèces</option>
									<option value="investment">Investissement</option>
								</select>
							</div>
							<div className="flex gap-2 pt-4">
								<button
									type="button"
									onClick={() => {
										setShowWalletModal(false);
										setEditingWallet(null);
										setNewWallet({ name: '', balance: '', type: 'checking' });
									}}
									className="flex-1 bg-[#F5F7FA] text-[#343A40] py-2 rounded hover:bg-gray-200"
								>
									Annuler
								</button>
								<button
									type="submit"
									className="flex-1 bg-[#1E73BE] text-white py-2 rounded hover:bg-[#155a8a]"
								>
									{editingWallet ? 'Modifier' : 'Ajouter'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
