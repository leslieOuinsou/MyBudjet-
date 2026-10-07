import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdAdd, MdClose } from 'react-icons/md';
import { addTransaction, getCategories, getWallets } from '../api.js';
import { cacheRefData, getCachedRefData, isNetworkError, queueTransaction } from '../lib/offline.js';
import { currencySymbol } from '../lib/format.js';
import { useI18n } from '../context/I18nContext.jsx';
import Toast from './Toast.jsx';

// Pages de l'espace connecté où le bouton + est proposé
const APP_PREFIXES = ['/dashboard', '/transactions', '/expenses', '/budgets', '/categories', '/bills', '/recurring', '/history', '/reports', '/insights', '/challenges', '/forecasts', '/importexport', '/documents', '/shared', '/notifications', '/profile', '/settings'];
const LAST_KEY = 'mybudget_quick_last';

const readLast = () => {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || '{}'); } catch { return {}; }
};
const hasToken = () => Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
const idOf = (item) => (item ? item._id || item.id : '');
const isTyping = (el) => el?.matches?.('input, textarea, select, [contenteditable="true"]');

const FIELD = 'w-full rounded-xl border-2 border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] px-4 py-3 text-gray-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]';

export default function QuickAdd() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const amountRef = useRef(null);

  const visible = APP_PREFIXES.some((p) => location.pathname.startsWith(p)) && hasToken();

  const loadRefData = useCallback(async () => {
    try {
      const [cats, wals] = await Promise.all([getCategories(), getWallets()]);
      setCategories(cats);
      setWallets(wals);
      cacheRefData({ categories: cats, wallets: wals });
    } catch {
      const cached = getCachedRefData();
      if (cached) {
        setCategories(cached.categories);
        setWallets(cached.wallets);
      } else {
        setError(t('quick.loadFailed'));
      }
    }
  }, [t]);

  const openSheet = useCallback(() => {
    setError('');
    setAmount('');
    setDescription('');
    setOpen(true);
    loadRefData();
  }, [loadRefData]);

  // Raccourci clavier N et raccourci d'icône (/dashboard?quick=1)
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey || isTyping(document.activeElement)) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      openSheet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, openSheet]);

  useEffect(() => {
    if (!visible || !new URLSearchParams(location.search).has('quick')) return;
    navigate(location.pathname, { replace: true });
    openSheet();
  }, [visible, location.search, location.pathname, navigate, openSheet]);

  // Catégorie / portefeuille : dernier choix, sinon premier de la liste
  const typeCategories = categories.filter((c) => c.type === type);
  useEffect(() => {
    if (!open) return;
    const last = readLast();
    if (!typeCategories.some((c) => idOf(c) === categoryId)) {
      setCategoryId(idOf(typeCategories.find((c) => idOf(c) === last[type]) || typeCategories[0]));
    }
    if (!wallets.some((w) => idOf(w) === walletId)) {
      setWalletId(idOf(wallets.find((w) => idOf(w) === last.wallet) || wallets[0]));
    }
  }, [open, categories, wallets, type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => amountRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const value = parseFloat(String(amount).replace(',', '.'));
    if (!(value > 0)) return setError(t('quick.invalidAmount'));
    if (!categoryId) return setError(t('quick.noCategory'));
    if (!walletId) return setError(t('quick.noWallet'));

    const categoryName = typeCategories.find((c) => idOf(c) === categoryId)?.name;
    const payload = {
      amount: value,
      type,
      category: categoryId,
      wallet: walletId,
      description: description.trim() || categoryName || t(type === 'income' ? 'quick.income' : 'quick.expense'),
      date: new Date().toISOString(),
    };

    setBusy(true);
    setError('');
    try {
      if (!navigator.onLine) throw new TypeError('offline');
      await addTransaction(payload);
      setToast({ type: 'success', message: t('quick.saved') });
      window.dispatchEvent(new CustomEvent('transactions-changed'));
    } catch (err) {
      if (!isNetworkError(err)) {
        setBusy(false);
        return setError(err.message);
      }
      queueTransaction(payload);
      setToast({ type: 'info', message: t('quick.queued') });
    }
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({ ...readLast(), [type]: categoryId, wallet: walletId }));
    } catch { /* stockage indisponible */ }
    setBusy(false);
    setOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <button
        type="button"
        onClick={openSheet}
        aria-label={t('quick.open')}
        title={`${t('quick.open')} — ${t('quick.shortcut')}`}
        className="fixed z-30 right-4 bottom-4 md:right-8 md:bottom-8 w-14 h-14 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] active:scale-95 transition flex items-center justify-center"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <MdAdd size={30} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-label={t('quick.title')}
            className="w-full sm:max-w-md bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">{t('quick.title')}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('quick.close')} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#334155]">
                <MdClose size={22} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#0F172A]" role="group">
              {['expense', 'income'].map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={type === v}
                  onClick={() => setType(v)}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${type === v ? (v === 'expense' ? 'bg-[#EF4444] text-white' : 'bg-[#22C55E] text-white') : 'text-gray-600 dark:text-[#CBD5E1]'}`}
                >
                  {t(`quick.${v}`)}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="quick-amount" className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#E2E8F0]">{t('quick.amount')} ({currencySymbol()})</label>
              <input
                id="quick-amount"
                ref={amountRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                className={`${FIELD} text-2xl font-bold`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quick-category" className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#E2E8F0]">{t('quick.category')}</label>
                <select id="quick-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={FIELD}>
                  {typeCategories.map((c) => <option key={idOf(c)} value={idOf(c)}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="quick-wallet" className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#E2E8F0]">{t('quick.wallet')}</label>
                <select id="quick-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={FIELD}>
                  {wallets.map((w) => <option key={idOf(w)} value={idOf(w)}>{w.name}</option>)}
                </select>
              </div>
            </div>
            {categories.length > 0 && wallets.length === 0 && <p className="text-sm text-amber-600 dark:text-[#FBBF24]">{t('quick.noData')}</p>}

            <div>
              <label htmlFor="quick-description" className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#E2E8F0]">{t('quick.description')}</label>
              <input id="quick-description" type="text" maxLength={120} placeholder={t('quick.descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} className={FIELD} />
            </div>

            {error && <p role="alert" className="text-sm text-red-600 dark:text-[#F87171]">{error}</p>}

            <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:opacity-60">
              {busy ? t('quick.saving') : t('quick.save')}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
