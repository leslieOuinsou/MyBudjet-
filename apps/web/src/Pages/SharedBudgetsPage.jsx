import React, { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '../lib/format.js';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import {
  getSharedBudgets, createSharedBudget, getSharedBudget, deleteSharedBudget,
  addSharedMember, addSharedExpense, deleteSharedExpense, addSharedSettlement,
} from '../api.js';

const formatAmount = (n, currency) => formatMoney(n, { currency });

const currentUserId = () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).id;
  } catch {
    return null;
  }
};

export default function SharedBudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [newName, setNewName] = useState('');
  const [email, setEmail] = useState('');
  const [expense, setExpense] = useState({ description: '', amount: '' });
  const me = currentUserId();

  const run = async (action, success) => {
    try {
      setError('');
      setInfo('');
      await action();
      if (success) setInfo(success);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadList = useCallback(async () => setBudgets(await getSharedBudgets()), []);
  const open = useCallback(async (id) => setSelected(await getSharedBudget(id)), []);

  useEffect(() => {
    getSharedBudgets().then(setBudgets).catch((err) => setError(err.message));
  }, []);

  const refresh = async (id) => { await open(id); await loadList(); };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-gray-900">
      <DashboardSidebar />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#2C3E50] dark:text-white">Budgets partagés</h1>
        {error && <p className="text-red-600">{error}</p>}
        {info && <p className="text-green-600">{info}</p>}

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <form
            className="flex gap-3 flex-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const created = await createSharedBudget({ name: newName });
                setNewName('');
                await loadList();
                await open(created._id);
              });
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom (ex : Coloc, Vacances, Couple)"
              className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              required
            />
            <button className="px-4 py-2 rounded-lg bg-[#1E73BE] text-white">Créer</button>
          </form>
          <div className="flex gap-2 flex-wrap mt-4">
            {budgets.map((b) => (
              <button
                key={b._id}
                onClick={() => run(() => open(b._id))}
                className={`px-3 py-1.5 rounded-lg border text-sm ${selected?._id === b._id ? 'bg-[#1E73BE] text-white' : 'dark:text-white'}`}
              >
                {b.name} · {b.members.length} membre{b.members.length > 1 ? 's' : ''}
              </button>
            ))}
            {budgets.length === 0 && <p className="text-sm text-gray-500">Aucun budget partagé pour l’instant.</p>}
          </div>
        </section>

        {selected && (
          <>
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-3">
              <div className="flex justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-[#2C3E50] dark:text-white">
                  {selected.name} · total {formatAmount(selected.total, selected.currency)}
                </h2>
                {selected.ownerId === me && (
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => window.confirm('Supprimer ce budget et toutes ses dépenses ?') &&
                      run(async () => { await deleteSharedBudget(selected._id); setSelected(null); await loadList(); })}
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Qui doit quoi</div>
                {selected.transfers.length === 0 ? (
                  <p className="text-sm text-green-600">Tout le monde est à jour.</p>
                ) : (
                  <ul className="space-y-1 text-sm dark:text-white">
                    {selected.transfers.map((t) => (
                      <li key={`${t.from}-${t.to}`} className="flex items-center justify-between gap-2">
                        <span>{t.fromName} doit <strong>{formatAmount(t.amount, selected.currency)}</strong> à {t.toName}</span>
                        {t.from === me && (
                          <button
                            className="px-2 py-1 rounded bg-[#1E73BE] text-white text-xs"
                            onClick={() => run(async () => {
                              await addSharedSettlement(selected._id, { toUserId: t.to, amount: t.amount });
                              await refresh(selected._id);
                            }, 'Remboursement enregistré')}
                          >
                            J’ai remboursé
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300">
                Membres : {selected.members.map((m) => m.user.name).join(', ')}
              </div>
              {selected.ownerId === me && (
                <form
                  className="flex gap-2 flex-wrap"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => { await addSharedMember(selected._id, email); setEmail(''); await refresh(selected._id); }, 'Membre ajouté');
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email d’un utilisateur MyBudget"
                    className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <button className="px-3 py-2 rounded-lg border text-sm dark:text-white">Inviter</button>
                </form>
              )}
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-3">
              <h2 className="text-lg font-semibold text-[#2C3E50] dark:text-white">Dépenses</h2>
              <form
                className="flex gap-2 flex-wrap"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await addSharedExpense(selected._id, { ...expense, amount: parseFloat(expense.amount) });
                    setExpense({ description: '', amount: '' });
                    await refresh(selected._id);
                  });
                }}
              >
                <input
                  value={expense.description}
                  onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                  placeholder="Ce que j’ai payé"
                  className="flex-1 min-w-[160px] border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="number" step="0.01" min="0.01"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  placeholder="Montant"
                  className="w-28 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  required
                />
                <button className="px-3 py-2 rounded-lg bg-[#1E73BE] text-white text-sm">Ajouter</button>
              </form>
              <p className="text-xs text-gray-500">La dépense est partagée à parts égales entre tous les membres.</p>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {selected.expenses.map((x) => (
                  <div key={x._id} className="py-2 flex justify-between gap-3 text-sm dark:text-white">
                    <span>{x.description} <span className="text-gray-500">· payé par {x.paidBy.name}</span></span>
                    <span className="flex items-center gap-3">
                      {formatAmount(x.amount, selected.currency)}
                      <button
                        className="text-red-600 text-xs"
                        onClick={() => run(async () => { await deleteSharedExpense(selected._id, x._id); await refresh(selected._id); })}
                      >
                        Supprimer
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
