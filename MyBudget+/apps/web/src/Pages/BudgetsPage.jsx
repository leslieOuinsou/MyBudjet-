import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getBudgets, addBudget, updateBudget, deleteBudget } from '../api.js';
import { 
  MdCheckCircle, MdWarning, MdError, MdShowChart, 
  MdEdit, MdDelete, MdAdd 
} from 'react-icons/md';

const CATEGORIES = [
  "Alimentation",
  "Logement",
  "Transport",
  "Divertissement",
  "Épargne",
];
const PERIODS = ["Mensuel", "Annuel"];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    amount: "",
    period: PERIODS[0],
    startDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  });
  const [editingBudget, setEditingBudget] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  // Fonction pour ouvrir le modal de modification
  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setForm({
      name: budget.name || "",
      category: budget.category?.name || "",
      amount: budget.amount || "",
      period: budget.period === 'month' ? 'Mensuel' : budget.period === 'year' ? 'Annuel' : 'Mensuel',
      startDate: budget.startDate ? new Date(budget.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      alertThreshold: budget.alertThreshold || 80,
    });
    setShowEditModal(true);
  };

  // Fonction pour supprimer un budget
  const handleDelete = async (budgetId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      try {
        await deleteBudget(budgetId);
        setBudgets(budgets.filter(b => b._id !== budgetId));
        setError('');
      } catch (e) {
        console.error('❌ Erreur lors de la suppression:', e);
        setError('Erreur lors de la suppression du budget');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      // Convertir la période en anglais selon le modèle Mongoose
      const periodMap = {
        'Mensuel': 'month',
        'Annuel': 'year'
      };
      
      const budgetData = {
        name: form.name,
        amount: parseFloat(form.amount),
        category: null, // On envoie null au lieu d'une chaîne de texte
        period: periodMap[form.period] || 'month', // Correction: 'month' au lieu de 'monthly'
        alertThreshold: parseInt(form.alertThreshold) || 80
      };
      
      if (editingBudget) {
        // Modification d'un budget existant
        console.log('📤 Modification du budget:', budgetData);
        const updatedBudget = await updateBudget(editingBudget._id, budgetData);
        setBudgets(budgets.map(b => b._id === editingBudget._id ? updatedBudget : b));
        setShowEditModal(false);
        setEditingBudget(null);
      } else {
        // Création d'un nouveau budget
        console.log('📤 Création du budget:', budgetData);
        const newBudget = await addBudget(budgetData);
        setBudgets([...budgets, newBudget]);
      }
      
      setForm({ name: "", category: "", amount: "", period: PERIODS[0], startDate: form.startDate });
    } catch (e) {
      console.error('❌ Erreur lors de la sauvegarde du budget:', e);
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 flex flex-col pt-16 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#22292F] dark:text-white">Budgets</h1>
            <div className="flex gap-4 items-center">
              <input 
                type="text" 
                placeholder="🔍 Rechercher" 
                className="w-full md:w-auto border border-[#EAF4FB] dark:border-[#404040] rounded-lg px-4 py-2 bg-[#F9FAFB] dark:bg-[#2d2d2d] text-[#22292F] dark:text-white focus:border-[#1E73BE]" 
              />
            </div>
          </div>
          {/* Formulaire de création */}
          <section className="bg-white dark:bg-[#2d2d2d] border border-[#EAF4FB] dark:border-[#404040] rounded-xl p-8 mb-8">
            <h2 className="text-xl font-bold text-[#22292F] dark:text-white mb-6">Créer un nouveau budget</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-[#343A40] dark:text-[#e0e0e0] text-sm">Nom du budget</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ex: Courses mensuelles" className="border border-[#EAF4FB] dark:border-[#404040] rounded-lg px-4 py-2 bg-[#F9FAFB] dark:bg-[#383838] text-[#22292F] dark:text-white focus:border-[#1E73BE]" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#343A40] dark:text-[#e0e0e0] text-sm">Catégorie</label>
                <select name="category" value={form.category} onChange={handleChange} className="border border-[#EAF4FB] dark:border-[#404040] rounded-lg px-4 py-2 bg-[#F9FAFB] dark:bg-[#383838] text-[#22292F] dark:text-white focus:border-[#1E73BE]" required>
                  <option value="">Sélectionner une catégorie</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#343A40] dark:text-[#e0e0e0] text-sm">Montant alloué</label>
                <input name="amount" value={form.amount} onChange={handleChange} type="number" min="0" step="0.01" className="border border-[#EAF4FB] dark:border-[#404040] rounded-lg px-4 py-2 bg-[#F9FAFB] dark:bg-[#383838] text-[#22292F] dark:text-white focus:border-[#1E73BE]" required />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[#343A40] dark:text-[#e0e0e0] text-sm">Période</label>
                  <select name="period" value={form.period} onChange={handleChange} className="border border-[#EAF4FB] dark:border-[#404040] rounded-lg px-4 py-2 bg-[#F9FAFB] dark:bg-[#383838] text-[#22292F] dark:text-white focus:border-[#1E73BE]">
                    {PERIODS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[#343A40] dark:text-[#e0e0e0] text-sm">Date de début</label>
                  <input type="text" value={form.startDate} disabled className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] text-[#6C757D]" />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-2 rounded-lg shadow transition">Créer un budget</button>
              </div>
            </form>
          </section>
          {/* Tableau des budgets */}
          <section className="bg-white dark:bg-[#2d2d2d] border border-[#EAF4FB] dark:border-[#404040] rounded-xl p-8">
            <h2 className="text-xl font-bold text-[#22292F] dark:text-white mb-6">Vos budgets actuels</h2>
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-[#F5F7FA] dark:bg-[#383838]">
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">CATÉGORIE</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">NOM DU BUDGET</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">PÉRIODE</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">MONTANT ALLOUÉ</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">DÉPENSES ACTUELLES</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">RESTE À DÉPENSER</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">PROGRESSION</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center text-[#1E73BE] py-8">Chargement...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="text-center text-[#DC3545] py-8">{error}</td>
                    </tr>
                  ) : (
                    budgets.map((b) => {
                      const spent = b.spent || 0;
                      const amount = b.amount || 0;
                      const reste = b.remaining || (amount - spent);
                      const percent = b.percentage || (amount > 0 ? Math.round((spent / amount) * 100) : 0);
                      const status = b.status || 'good';
                      
                      // Couleurs basées sur le statut
                      let color = "bg-[#22C55E]"; // Vert par défaut
                      let StatusIcon = MdCheckCircle;
                      let statusText = "En cours";
                      
                      switch (status) {
                        case 'exceeded':
                          color = "bg-[#DC2626]";
                          StatusIcon = MdError;
                          statusText = "Dépassé";
                          break;
                        case 'warning':
                          color = "bg-[#FACC15]";
                          StatusIcon = MdWarning;
                          statusText = "Attention";
                          break;
                        case 'half':
                          color = "bg-[#3B82F6]";
                          StatusIcon = MdShowChart;
                          statusText = "À mi-chemin";
                          break;
                        case 'good':
                        default:
                          color = "bg-[#22C55E]";
                          StatusIcon = MdCheckCircle;
                          statusText = "En cours";
                          break;
                      }
                      
                      return (
                        <tr key={b._id} className="even:bg-white odd:bg-[#F5F7FA]">
                          <td className="px-4 py-3 font-medium">{b.category || 'Général'}</td>
                          <td className="px-4 py-3">{b.name}</td>
                          <td className="px-4 py-3">{b.period}</td>
                          <td className="px-4 py-3">{amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span>{spent.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                              {b.alertMessage && (
                                <span className="text-xs" title={b.alertMessage}>💡</span>
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${reste < 0 ? "text-[#DC2626] font-semibold" : ""}`}>
                            {reste < 0 ? `-${Math.abs(reste).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : reste.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="w-full h-2 bg-[#EAF4FB] rounded-full overflow-hidden">
                                  <div className={`h-2 rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs font-semibold text-[#22292F]">{percent}%</span>
                                  <span className="text-xs text-[#6C757D] flex items-center gap-1">
                                    <StatusIcon size={14} />
                                    {statusText}
                                  </span>
                                </div>
                                {b.daysRemaining !== null && b.daysRemaining > 0 && (
                                  <div className="text-xs text-[#6C757D] mt-1">
                                    {b.daysRemaining} jour{b.daysRemaining > 1 ? 's' : ''} restant{b.daysRemaining > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button 
                              onClick={() => handleEdit(b)}
                              className="text-[#1E73BE] hover:underline text-sm"
                              title="Modifier"
                            >
                              <MdEdit size={20} />
                            </button>
                            <button 
                              onClick={() => handleDelete(b._id)}
                              className="text-[#DC2626] hover:underline text-sm"
                              title="Supprimer"
                            >
                              <MdDelete size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <footer className="flex flex-col md:flex-row items-center justify-between gap-2 mt-8 text-[#6C757D] text-sm">
            <div className="flex gap-6">
              <span>MyBudget+</span>
              <span>Ressources</span>
              <span>Légal</span>
            </div>
            <div className="flex gap-4 text-xl">
              <span className="hover:text-[#1E73BE] cursor-pointer">{String.fromCharCode(0xf09a)}</span>
              <span className="hover:text-[#1E73BE] cursor-pointer">{String.fromCharCode(0xf099)}</span>
              <span className="hover:text-[#1E73BE] cursor-pointer">{String.fromCharCode(0xf0e1)}</span>
              <span className="hover:text-[#1E73BE] cursor-pointer">{String.fromCharCode(0xf16d)}</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal de modification */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#22292F]">Modifier le budget</h3>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBudget(null);
                }}
                className="text-[#DC3545] hover:text-[#B02A37] text-xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Nom du budget</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Catégorie</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Montant (€)</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Période</label>
                  <select
                    name="period"
                    value={form.period}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                  >
                    {PERIODS.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Seuil d'alerte (%)</label>
                  <input
                    type="number"
                    name="alertThreshold"
                    value={form.alertThreshold || 80}
                    onChange={handleChange}
                    min="10"
                    max="100"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    title="Pourcentage à partir duquel vous recevrez une alerte"
                  />
                  <p className="text-xs text-[#6C757D] mt-1">Défaut: 80% (alerte quand 80% du budget est utilisé)</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#1E73BE] text-white py-2 px-4 rounded-md hover:bg-[#1557A0] transition-colors"
                >
                  {editingBudget ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBudget(null);
                  }}
                  className="flex-1 bg-[#6C757D] text-white py-2 px-4 rounded-md hover:bg-[#545B62] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
