import React, { useEffect, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar.jsx";
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  getCategories,
  getWallets,
} from "../api.js";

import { formatMoney, formatDate } from '../lib/format.js';
const FREQ_LABELS = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

const emptyForm = () => ({
  note: "",
  amount: "",
  type: "expense",
  category: "",
  wallet: "",
  frequency: "monthly",
  nextDate: new Date().toISOString().split("T")[0],
});

export default function RecurringTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [recs, cats, wals] = await Promise.all([
        getRecurringTransactions(),
        getCategories(),
        getWallets(),
      ]);
      setTransactions(Array.isArray(recs) ? recs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setWallets(Array.isArray(wals) ? wals : []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = transactions.filter((t) => {
    const label = (t.note || t.description || "").toLowerCase();
    const catName = t.category?.name || "";
    const matchSearch = label.includes(search.toLowerCase());
    const matchCat =
      !categoryFilter ||
      (t.category?._id || t.categoryId) === categoryFilter ||
      catName === categoryFilter;
    return matchSearch && matchCat;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingId(t._id || t.id);
    setForm({
      note: t.note || "",
      amount: t.amount ?? "",
      type: t.type || "expense",
      category: t.category?._id || t.categoryId || "",
      wallet: t.wallet?._id || t.walletId || "",
      frequency: t.frequency || "monthly",
      nextDate: t.nextDate
        ? new Date(t.nextDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        note: form.note,
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category || null,
        wallet: form.wallet || null,
        frequency: form.frequency,
        nextDate: form.nextDate,
      };

      if (editingId) {
        await updateRecurringTransaction(editingId, payload);
      } else {
        await createRecurringTransaction(payload);
      }
      closeModal();
      await loadData();
    } catch (err) {
      setError(err.message || (editingId ? "Erreur lors de la modification" : "Erreur lors de la création"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette transaction récurrente ?")) return;
    try {
      await deleteRecurringTransaction(id);
      setTransactions((prev) => prev.filter((t) => (t._id || t.id) !== id));
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 px-4 md:px-12 py-6 md:py-10 flex flex-col pt-16 md:pt-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mb-6 md:mb-8">
            Transactions récurrentes
          </h1>

          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-[#F87171] bg-red-50 dark:bg-[#7F1D1D]/30 border border-red-100 dark:border-[#7F1D1D] rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <button
              onClick={openCreateModal}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-5 py-2 rounded-lg shadow transition w-fit"
            >
              Ajouter une nouvelle transaction
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Rechercher des transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-4 py-2 bg-[#F8FAFC] dark:bg-[#334155]/50 focus:border-[#2563EB] w-full sm:w-72"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-4 py-2 bg-[#F8FAFC] dark:bg-[#334155]/50 focus:border-[#2563EB]"
              >
                <option value="">Filtrer par catégorie</option>
                {categories.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow">
            {loading ? (
              <div className="p-8 text-center text-[#64748B] dark:text-[#94A3B8]">Chargement...</div>
            ) : (
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-[#334155]/50">
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Nom</th>
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Fréquence</th>
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Montant</th>
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Catégorie</th>
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Prochaine échéance</th>
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Type</th>
                    <th className="px-4 py-3 text-left text-[#0F172A] dark:text-[#F8FAFC] font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#64748B] dark:text-[#94A3B8]">
                        Aucune transaction récurrente
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => {
                      const id = t._id || t.id;
                      return (
                        <tr key={id} className="even:bg-white dark:even:bg-[#1E293B] odd:bg-[#F8FAFC] dark:odd:bg-[#334155]/50">
                          <td className="px-4 py-3 font-medium">{t.note || "Sans titre"}</td>
                          <td className="px-4 py-3">{FREQ_LABELS[t.frequency] || t.frequency}</td>
                          <td className="px-4 py-3">
                            {formatMoney(Number(t.amount || 0))}
                          </td>
                          <td className="px-4 py-3">{t.category?.name || "—"}</td>
                          <td className="px-4 py-3">
                            {t.nextDate ? formatDate(t.nextDate) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {t.type === "income" ? "Revenu" : "Dépense"}
                          </td>
                          <td className="px-4 py-3 flex gap-3">
                            <button
                              onClick={() => openEditModal(t)}
                              className="text-[#2563EB] dark:text-[#60A5FA] hover:underline text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(id)}
                              className="text-[#64748B] dark:text-[#94A3B8] hover:underline text-sm"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {editingId ? "Modifier la récurrence" : "Nouvelle récurrence"}
              </h3>
              <button onClick={closeModal} className="text-[#64748B] dark:text-[#94A3B8]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Libellé (ex: Netflix)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Montant"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Catégorie (optionnel)</option>
                {categories.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={form.wallet}
                onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Portefeuille (optionnel)</option>
                {wallets.map((w) => (
                  <option key={w._id || w.id} value={w._id || w.id}>{w.name}</option>
                ))}
              </select>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
              </select>
              <input
                type="date"
                value={form.nextDate}
                onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 bg-[#F8FAFC] dark:bg-[#334155]/50 py-2 rounded">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#1E3A8A] text-white py-2 rounded disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
