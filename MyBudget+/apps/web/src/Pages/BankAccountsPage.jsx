import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { useTheme } from '../context/ThemeContext';
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  getBankAccountsStats,
} from '../api';
import {
  MdAccountBalance,
  MdAdd,
  MdEdit,
  MdDelete,
  MdStar,
  MdStarBorder,
  MdClose,
  MdSave,
  MdTrendingUp,
  MdCreditCard,
  MdSavings,
  MdAccountBalanceWallet,
} from 'react-icons/md';

export default function BankAccountsPage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    bankName: '',
    accountType: 'checking',
    accountNumber: '',
    currency: 'EUR',
    balance: 0,
    description: '',
    color: '#1E73BE',
    icon: '🏦',
  });

  const accountTypes = [
    { value: 'checking', label: 'Compte courant', icon: <MdAccountBalance /> },
    { value: 'savings', label: 'Compte d\'épargne', icon: <MdSavings /> },
    { value: 'credit_card', label: 'Carte de crédit', icon: <MdCreditCard /> },
    { value: 'investment', label: 'Investissement', icon: <MdTrendingUp /> },
    { value: 'other', label: 'Autre', icon: <MdAccountBalanceWallet /> },
  ];

  const colors = [
    '#1E73BE', '#28A745', '#DC3545', '#FFC107', '#6F42C1',
    '#20C997', '#FD7E14', '#E83E8C', '#17A2B8', '#6C757D',
  ];

  const icons = ['🏦', '💳', '💰', '📊', '💵', '💴', '💶', '💷', '🏧', '🪙'];

  useEffect(() => {
    loadAccounts();
    loadStats();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getBankAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getBankAccountsStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingAccount) {
        await updateBankAccount(editingAccount._id, formData);
        setSuccess('Compte bancaire mis à jour avec succès !');
      } else {
        await createBankAccount(formData);
        setSuccess('Compte bancaire ajouté avec succès !');
      }

      setShowModal(false);
      resetForm();
      loadAccounts();
      loadStats();
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bankName,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
      currency: account.currency,
      balance: account.balance,
      description: account.description || '',
      color: account.color,
      icon: account.icon,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;

    try {
      await deleteBankAccount(id);
      setSuccess('Compte bancaire supprimé avec succès !');
      loadAccounts();
      loadStats();
    } catch (error) {
      console.error('Erreur suppression:', error);
      setError(error.message);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await setPrimaryBankAccount(id);
      setSuccess('Compte principal défini avec succès !');
      loadAccounts();
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountType: 'checking',
      accountNumber: '',
      currency: 'EUR',
      balance: 0,
      description: '',
      color: '#1E73BE',
      icon: '🏦',
    });
    setEditingAccount(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <DashboardHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} pt-16 p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              💳 Mes Comptes Bancaires
            </h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MdAdd size={20} />
              Ajouter un compte
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nombre de comptes
                </h3>
                <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalAccounts}
                </p>
              </div>
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Solde total
                </h3>
                <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalBalance.toFixed(2)} €
                </p>
              </div>
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Devise principale
                </h3>
                <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {Object.keys(stats.byCurrency)[0] || 'EUR'}
                </p>
              </div>
            </div>
          )}

          {/* Liste des comptes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
              <MdAccountBalance className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Aucun compte bancaire configuré
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                Commencez par ajouter votre premier compte
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account._id}
                  className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow hover:shadow-lg transition-shadow`}
                  style={{ borderLeft: `4px solid ${account.color}` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{account.icon}</span>
                      <div>
                        <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {account.bankName}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {accountTypes.find(t => t.value === account.accountType)?.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetPrimary(account._id)}
                      className="text-yellow-500 hover:text-yellow-600"
                      title={account.isPrimary ? 'Compte principal' : 'Définir comme principal'}
                    >
                      {account.isPrimary ? <MdStar size={24} /> : <MdStarBorder size={24} />}
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {account.maskedAccountNumber}
                    </p>
                    <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {account.balance.toFixed(2)} {account.currency}
                    </p>
                  </div>

                  {account.description && (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      {account.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
                    >
                      <MdEdit size={18} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
                      className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {editingAccount ? 'Modifier le compte' : 'Ajouter un compte bancaire'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <MdClose size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom de la banque *
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Type de compte *
                    </label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      required
                    >
                      {accountTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Numéro de compte (4 derniers chiffres) *
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.slice(-4) })}
                      className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="1234"
                      maxLength={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Devise
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="XOF">XOF (F CFA)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Solde initial
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description (optionnelle)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Couleur
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-full border-2 ${formData.color === color ? 'border-black' : 'border-gray-300'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Icône
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {icons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`text-3xl p-2 rounded ${formData.icon === icon ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <MdSave size={20} />
                      {editingAccount ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

