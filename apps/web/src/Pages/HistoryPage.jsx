import React, { useState, useEffect, useCallback } from 'react';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import {
  MdHistory, MdDelete, MdRestore, MdDeleteForever, MdAddCircle, MdEdit, MdErrorOutline, MdCheckCircle, MdDeleteSweep,
} from 'react-icons/md';
import { getTrash, restoreTransaction, purgeTransaction, emptyTrash, getActivity } from '../api.js';
import { formatMoney, formatDate } from '../lib/format.js';

const CARD = 'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm';

const ACTIONS = {
  create: { icon: MdAddCircle, tone: 'bg-[#DCFCE7] dark:bg-[#14532D]/50 text-[#16A34A] dark:text-[#22C55E]', label: 'Ajout' },
  update: { icon: MdEdit, tone: 'bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE]', label: 'Modification' },
  delete: { icon: MdDelete, tone: 'bg-amber-100 dark:bg-[#78350F]/50 text-[#B45309] dark:text-[#FCD34D]', label: 'Corbeille' },
  restore: { icon: MdRestore, tone: 'bg-[#DCFCE7] dark:bg-[#14532D]/50 text-[#16A34A] dark:text-[#22C55E]', label: 'Restauration' },
  purge: { icon: MdDeleteForever, tone: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/50 text-[#DC2626] dark:text-[#F87171]', label: 'Suppression' },
};

const FIELD_LABELS = { amount: 'Montant', type: 'Type', description: 'Libellé', note: 'Note', date: 'Date', categoryId: 'Catégorie', walletId: 'Portefeuille' };

const showValue = (field, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'amount') return formatMoney(value);
  if (field === 'date') return formatDate(value);
  if (field === 'type') return value === 'expense' ? 'Dépense' : value === 'income' ? 'Revenu' : value;
  if (field === 'categoryId' || field === 'walletId') return 'modifié';
  return String(value);
};

const changesOf = (log) => {
  if (log.action !== 'update' || !log.before || !log.after) return [];
  return Object.keys(FIELD_LABELS)
    .filter((f) => JSON.stringify(log.before[f]) !== JSON.stringify(log.after[f]))
    .map((f) => ({ field: f, from: log.before[f], to: log.after[f] }));
};

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 2592000) return `il y a ${Math.floor(s / 86400)} j`;
  return formatDate(iso);
};

export default function HistoryPage() {
  const [tab, setTab] = useState('trash');
  const [trash, setTrash] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const notify = (text) => {
    setSuccess(text);
    setTimeout(() => setSuccess(''), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([getTrash(), getActivity(150)]);
      setTrash(Array.isArray(t) ? t : []);
      setActivity(Array.isArray(a) ? a : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, message) => {
    try {
      await fn();
      notify(message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 px-3 sm:px-5 md:px-10 pt-16 pb-6 md:pt-10 md:pb-10 space-y-4 md:space-y-6 max-w-5xl">
          <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white p-4 sm:p-6 md:p-8 shadow-sm flex items-center gap-3 md:gap-4">
            <span className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-white/20 flex items-center justify-center text-2xl md:text-3xl"><MdHistory /></span>
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold">Corbeille et historique</h1>
              <p className="text-white/85 text-xs md:text-sm mt-1">Retrouvez une transaction supprimée par erreur et voyez qui a changé quoi.</p>
            </div>
          </header>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-[#7F1D1D]/30 border border-red-200 dark:border-[#7F1D1D] text-red-700 dark:text-[#FCA5A5] rounded-xl text-sm">
              <MdErrorOutline className="text-xl shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-[#14532D]/30 border border-green-200 dark:border-[#166534] text-green-700 dark:text-[#4ADE80] rounded-xl text-sm">
              <MdCheckCircle className="text-xl shrink-0" /> {success}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {[{ id: 'trash', label: `Corbeille (${trash.length})`, icon: MdDelete }, { id: 'activity', label: 'Historique', icon: MdHistory }].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === id ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white' : 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#DBEAFE] dark:hover:bg-[#1E40AF]'}`}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-[#64748B] dark:text-[#94A3B8] justify-center py-10">
              <span className="h-5 w-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" /> Chargement…
            </div>
          ) : tab === 'trash' ? (
            <section className={`${CARD} p-3 sm:p-5 md:p-6`}>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Les transactions supprimées restent ici 30 jours, puis disparaissent définitivement. Restaurer remet aussi le solde du portefeuille.</p>
                {trash.length > 0 && (
                  <button
                    onClick={() => window.confirm(`Supprimer définitivement ${trash.length} transaction(s) ?`) && act(emptyTrash, 'Corbeille vidée ✓')}
                    className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DC2626] text-[#DC2626] dark:text-[#F87171] dark:border-[#F87171] text-sm font-semibold hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30"
                  >
                    <MdDeleteSweep /> Vider la corbeille
                  </button>
                )}
              </div>
              {trash.length === 0 ? (
                <div className="text-center py-12 text-[#64748B] dark:text-[#94A3B8]">
                  <MdDelete className="mx-auto text-6xl text-gray-300 dark:text-[#475569] mb-2" />
                  La corbeille est vide.
                </div>
              ) : (
                <ul className="space-y-3">
                  {trash.map((t) => (
                    <li key={t._id || t.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-3 sm:p-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] break-words sm:truncate">{t.description || 'Sans libellé'}</div>
                        <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          {formatDate(t.date)} · {t.category?.name || 'Sans catégorie'}{t.wallet?.name ? ` · ${t.wallet.name}` : ''} · supprimée {timeAgo(t.deletedAt)} · {daysLeft(t.purgeAt)} j restants
                        </div>
                      </div>
                      <div className={`font-bold text-lg sm:text-base ${t.type === 'income' ? 'text-[#16A34A] dark:text-[#22C55E]' : 'text-[#DC2626] dark:text-[#F87171]'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                      </div>
                      <div className="flex gap-2 sm:gap-1 items-center">
                        <button onClick={() => act(() => restoreTransaction(t._id || t.id), 'Transaction restaurée ✓')} className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#DBEAFE] dark:hover:bg-[#1E40AF]">
                          <MdRestore /> Restaurer
                        </button>
                        <button
                          onClick={() => window.confirm('Supprimer définitivement cette transaction ?') && act(() => purgeTransaction(t._id || t.id), 'Supprimée définitivement ✓')}
                          className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30"
                          title="Supprimer définitivement"
                          aria-label="Supprimer définitivement"
                        >
                          <MdDeleteForever />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section className={`${CARD} p-3 sm:p-5 md:p-6`}>
              {activity.length === 0 ? (
                <div className="text-center py-12 text-[#64748B] dark:text-[#94A3B8]">
                  <MdHistory className="mx-auto text-6xl text-gray-300 dark:text-[#475569] mb-2" />
                  Aucune activité enregistrée pour le moment. Les ajouts, modifications et suppressions de transactions apparaîtront ici.
                </div>
              ) : (
                <ol className="space-y-3">
                  {activity.map((log) => {
                    const meta = ACTIONS[log.action] || ACTIONS.update;
                    const Icon = meta.icon;
                    const changes = changesOf(log);
                    return (
                      <li key={log._id || log.id} className="flex items-start gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${meta.tone}`}><Icon /></span>
                        <div className="min-w-0 flex-1 pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                          <div className="text-sm text-[#0F172A] dark:text-[#F8FAFC]">{log.summary}</div>
                          {log.action === 'create' && log.after && (
                            <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{formatMoney(log.after.amount)} · {formatDate(log.after.date)}</div>
                          )}
                          {changes.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {changes.map((c) => (
                                <li key={c.field} className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                                  <span className="font-semibold">{FIELD_LABELS[c.field]}</span> : {showValue(c.field, c.from)} → <span className="text-[#0F172A] dark:text-[#F8FAFC] font-medium">{showValue(c.field, c.to)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="text-xs text-[#94A3B8] mt-1" title={new Date(log.createdAt).toLocaleString('fr-FR')}>{meta.label} · {timeAgo(log.createdAt)}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
