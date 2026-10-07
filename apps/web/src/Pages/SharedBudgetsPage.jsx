import React, { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '../lib/format.js';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { MdGroups, MdAdd, MdPersonAdd, MdDelete, MdReceiptLong, MdSwapHoriz, MdCheckCircle, MdAddShoppingCart } from 'react-icons/md';
import {
  getSharedBudgets, createSharedBudget, getSharedBudget, deleteSharedBudget,
  addSharedMember, addSharedExpense, deleteSharedExpense, addSharedSettlement,
} from '../api.js';

const formatAmount = (n, currency) => formatMoney(n, { currency });

const CARD = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6';
const INPUT = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E73BE]/40';
const AVATARS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-600'];
const Avatar = ({ name, i = 0 }) => (
  <span className={`w-8 h-8 rounded-full ${AVATARS[i % AVATARS.length]} text-white text-xs font-bold flex items-center justify-center shrink-0`} title={name}>
    {(name || '?').charAt(0).toUpperCase()}
  </span>
);

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
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <DashboardSidebar />
      <main className="flex-1 p-5 md:p-10 space-y-6 max-w-5xl">
        <header className="rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#1E73BE] text-white p-6 md:p-8 shadow-sm flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl"><MdGroups /></span>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Budgets partagés</h1>
            <p className="text-white/85 text-sm mt-1">Colocation, voyage, couple : partagez les dépenses et sachez qui doit quoi.</p>
          </div>
        </header>
        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {info && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{info}</div>}

        <section className={CARD}>
          <h2 className="font-bold text-lg text-[#22292F] mb-4">Mes budgets</h2>
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
              className={`flex-1 min-w-[200px] ${INPUT}`}
              required
            />
            <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E73BE] text-white text-sm font-semibold hover:bg-[#155a8a]">
              <MdAdd /> Créer
            </button>
          </form>
          <div className="flex gap-2 flex-wrap mt-4">
            {budgets.map((b) => (
              <button
                key={b._id}
                onClick={() => run(() => open(b._id))}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${selected?._id === b._id ? 'bg-[#1E73BE] border-[#1E73BE] text-white' : 'bg-white border-gray-200 text-[#22292F] hover:border-[#1E73BE]'}`}
              >
                {b.name} · {b.members.length} membre{b.members.length > 1 ? 's' : ''}
              </button>
            ))}
            {budgets.length === 0 && (
              <div className="w-full text-center py-8 text-gray-500">
                <MdGroups className="mx-auto text-5xl text-gray-300 mb-2" />
                Aucun budget partagé pour l’instant.
              </div>
            )}
          </div>
        </section>

        {selected && (
          <>
            <section className={`${CARD} space-y-5`}>
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#22292F]">{selected.name}</h2>
                  <div className="text-sm text-gray-500">Total des dépenses</div>
                  <div className="text-3xl font-extrabold text-[#1E73BE]">{formatAmount(selected.total, selected.currency)}</div>
                </div>
                {selected.ownerId === me && (
                  <button
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                    onClick={() => window.confirm('Supprimer ce budget et toutes ses dépenses ?') &&
                      run(async () => { await deleteSharedBudget(selected._id); setSelected(null); await loadList(); })}
                  >
                    <MdDelete /> Supprimer
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex -space-x-2">
                  {selected.members.map((m, i) => <Avatar key={m.user._id || i} name={m.user.name} i={i} />)}
                </div>
                <span className="text-sm text-gray-600">{selected.members.map((m) => m.user.name).join(', ')}</span>
              </div>

              <div className="rounded-xl bg-[#F5F7FA] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#22292F] mb-3"><MdSwapHoriz className="text-lg text-[#1E73BE]" /> Qui doit quoi</div>
                {selected.transfers.length === 0 ? (
                  <p className="inline-flex items-center gap-2 text-sm text-green-700 font-medium"><MdCheckCircle /> Tout le monde est à jour.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {selected.transfers.map((t) => (
                      <li key={`${t.from}-${t.to}`} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3">
                        <span><strong>{t.fromName}</strong> doit <strong className="text-[#EB6834]">{formatAmount(t.amount, selected.currency)}</strong> à <strong>{t.toName}</strong></span>
                        {t.from === me && (
                          <button
                            className="px-3 py-1.5 rounded-lg bg-[#1BAF7A] text-white text-xs font-semibold hover:opacity-90"
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
                    className={`flex-1 min-w-[200px] ${INPUT}`}
                    required
                  />
                  <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E73BE] text-[#1E73BE] text-sm font-semibold hover:bg-[#E8F1FA]">
                    <MdPersonAdd /> Inviter
                  </button>
                </form>
              )}
            </section>

            <section className={`${CARD} space-y-4`}>
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#22292F]"><MdReceiptLong className="text-[#1E73BE]" /> Dépenses</h2>
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
                  className={`flex-1 min-w-[160px] ${INPUT}`}
                  required
                />
                <input
                  type="number" step="0.01" min="0.01"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  placeholder="Montant"
                  className={`w-32 ${INPUT}`}
                  required
                />
                <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E73BE] text-white text-sm font-semibold hover:bg-[#155a8a]">
                  <MdAddShoppingCart /> Ajouter
                </button>
              </form>
              <p className="text-xs text-gray-500">La dépense est partagée à parts égales entre tous les membres.</p>
              {selected.expenses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucune dépense pour l’instant.</p>
              ) : (
                <ul className="space-y-2">
                  {selected.expenses.map((x) => (
                    <li key={x._id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
                      <Avatar name={x.paidBy.name} i={selected.members.findIndex((m) => m.user.name === x.paidBy.name)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#22292F] truncate">{x.description}</div>
                        <div className="text-xs text-gray-500">payé par {x.paidBy.name}</div>
                      </div>
                      <div className="font-bold text-[#22292F]">{formatAmount(x.amount, selected.currency)}</div>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Supprimer"
                        aria-label="Supprimer la dépense"
                        onClick={() => run(async () => { await deleteSharedExpense(selected._id, x._id); await refresh(selected._id); })}
                      >
                        <MdDelete />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
