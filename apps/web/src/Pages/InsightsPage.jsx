import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { MdInsights, MdAutorenew, MdAccountBalance, MdAutoAwesome, MdLightbulb, MdSend } from 'react-icons/md';
import { getSubscriptions, getHealthScore, getAccountsSummary, getAiStatus, askAssistant } from '../api.js';

import { formatMoney } from '../lib/format.js';
const FREQUENCY_LABELS = { weekly: 'Hebdo', monthly: 'Mensuel', yearly: 'Annuel' };
const LEVEL_STYLES = {
  excellent: 'bg-green-100 dark:bg-[#14532D]/50 text-green-700 dark:text-[#4ADE80]',
  bon: 'bg-blue-100 dark:bg-[#1E40AF]/50 text-blue-700 dark:text-[#BFDBFE]',
  moyen: 'bg-amber-100 dark:bg-[#78350F/50] text-amber-700 dark:text-[#FCD34D]',
  fragile: 'bg-red-100 dark:bg-[#7F1D1D]/50 text-red-700 dark:text-[#FCA5A5]',
};
const BREAKDOWN_LABELS = {
  savings: 'Épargne',
  budgets: 'Budgets respectés',
  goals: 'Objectifs',
  tracking: 'Suivi régulier',
};

const LEVEL_COLORS = { excellent: '#16A34A', bon: '#2563EB', moyen: '#C98500', fragile: '#DC2626' };
const BAR_COLORS = { savings: '#2563EB', budgets: '#F59E0B', goals: '#16A34A', tracking: '#F59E0B' };

// Jauge circulaire : l'arc part du haut et se remplit au prorata du score
function ScoreRing({ score, level }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const color = LEVEL_COLORS[level] || '#2563EB';
  return (
    <div className="relative w-40 h-40 shrink-0" role="img" aria-label={`Score ${score} sur 100, niveau ${level}`}>
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] leading-none">{score}</span>
        <span className="text-xs text-gray-500 dark:text-[#94A3B8] mt-1">sur 100 · {level}</span>
      </div>
    </div>
  );
}

const formatAmount = (n) => formatMoney(n);

const CARD = 'bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm p-6';

const SectionTitle = ({ icon: Icon, title, hint, tone = 'bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE]' }) => (
  <div className="flex items-start gap-3 mb-5">
    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${tone}`}><Icon /></span>
    <div>
      <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-tight">{title}</h2>
      {hint && <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-0.5">{hint}</p>}
    </div>
  </div>
);

const Stat = ({ label, value, sub, accent }) => (
  <div className={`${CARD} !p-5 border-l-4`} style={{ borderLeftColor: accent }}>
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#94A3B8]">{label}</div>
    <div className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-1">{value}</div>
    {sub && <div className="text-xs text-gray-500 dark:text-[#94A3B8] mt-1">{sub}</div>}
  </div>
);

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);
  const [subs, setSubs] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');

  const ask = async (e) => {
    e.preventDefault();
    setAsking(true);
    setAskError('');
    setAnswer('');
    try {
      setAnswer((await askAssistant(question)).answer);
    } catch (err) {
      setAskError(err.message);
    } finally {
      setAsking(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [h, s] = await Promise.all([getHealthScore(), getSubscriptions()]);
        setHealth(h);
        setSubs(s);
        // Facultatifs : ne bloquent pas la page s'ils échouent (service de taux, IA non configurée)
        getAccountsSummary().then(setAccounts).catch(() => {});
        getAiStatus().then((st) => setAiReady(st.configured)).catch(() => {});
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <DashboardSidebar />
      <main className="flex-1 p-5 md:p-10 space-y-6 max-w-6xl">
        <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white p-6 md:p-8 shadow-sm flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl"><MdInsights /></span>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Analyse financière</h1>
            <p className="text-white/85 text-sm mt-1">Ta santé financière, tes abonnements et tes comptes, en un coup d’œil.</p>
          </div>
        </header>

        {loading && (
          <div className="flex items-center gap-3 text-gray-500 dark:text-[#94A3B8]">
            <span className="h-5 w-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" /> Chargement…
          </div>
        )}
        {error && <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-[#7F1D1D]/30 border border-red-200 dark:border-[#7F1D1D] text-red-700 dark:text-[#FCA5A5] text-sm">{error}</div>}

        {(health || subs || accounts) && (
          <div className="grid gap-4 sm:grid-cols-3">
            {health && <Stat label="Score de santé" value={`${health.score}/100`} sub={`Niveau ${health.level}`} accent={LEVEL_COLORS[health.level]} />}
            {subs && <Stat label="Abonnements" value={`${formatAmount(subs.totalMonthly)} /mois`} sub={`${subs.subscriptions.length} détecté(s)`} accent="#F59E0B" />}
            {accounts && <Stat label="Total des comptes" value={formatAmount(accounts.total)} sub={`en ${accounts.base}`} accent="#16A34A" />}
          </div>
        )}

        {health && (
          <section className={CARD}>
            <SectionTitle icon={MdInsights} title="Score de santé financière" hint="Calculé d’après ton épargne, tes budgets, tes objectifs et ta régularité." />
            <div className="flex items-center gap-8 flex-wrap">
              <ScoreRing score={health.score} level={health.level} />
              <div className="flex-1 min-w-[240px] space-y-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${LEVEL_STYLES[health.level] || 'bg-gray-100 dark:bg-[#334155] text-gray-700 dark:text-[#E2E8F0]'}`}>
                  {health.level}
                </span>
                {Object.entries(health.breakdown).map(([key, { points, max }]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">{BREAKDOWN_LABELS[key]}</span>
                      <span className="text-gray-500 dark:text-[#94A3B8] font-semibold">{points}/{max}</span>
                    </div>
                    <div className="h-2.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
                      <div
                        className="h-2.5 rounded-full"
                        style={{ width: `${(points / max) * 100}%`, backgroundColor: BAR_COLORS[key], transition: 'width 700ms ease' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {health.tips.length > 0 && (
              <div className="mt-6 rounded-xl bg-amber-50 dark:bg-[#78350F]/30 border border-amber-200 dark:border-[#92400E] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-[#FCD34D] mb-2"><MdLightbulb /> Conseils pour progresser</div>
                <ul className="list-disc pl-5 text-sm text-amber-900 dark:text-[#FDE68A] space-y-1">
                  {health.tips.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        {subs && (
          <section className={CARD}>
            <SectionTitle
              icon={MdAutorenew}
              tone="bg-orange-100 dark:bg-[#78350F]/50 text-orange-600 dark:text-[#FBBF24]"
              title="Abonnements détectés"
              hint={subs.subscriptions.length > 0
                ? `${formatAmount(subs.totalMonthly)} par mois, soit ${formatAmount(subs.totalYearly)} par an.`
                : 'Aucun abonnement détecté. Il faut au moins 3 paiements réguliers du même libellé.'}
            />
            <div className="space-y-3">
              {subs.subscriptions.map((s) => (
                <div key={s.key} className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-[#334155] p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50 transition-colors">
                  <span className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-[#78350F]/30 text-orange-600 dark:text-[#FBBF24] font-extrabold flex items-center justify-center shrink-0">
                    {(s.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#334155] mr-2">{FREQUENCY_LABELS[s.frequency]}</span>
                      {s.occurrences} paiements{s.category ? ` · ${s.category}` : ''}
                    </div>
                    <div className="h-1.5 mt-2 w-full max-w-xs bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-orange-400"
                        style={{ width: `${Math.max(4, (s.yearlyCost / subs.subscriptions[0].yearlyCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{formatAmount(s.amount)}</div>
                    <div className="text-xs text-gray-500 dark:text-[#94A3B8]">{formatAmount(s.yearlyCost)} / an</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {accounts && accounts.accounts.length > 0 && (
          <section className={CARD}>
            <SectionTitle
              icon={MdAccountBalance}
              tone="bg-green-100 dark:bg-[#14532D]/50 text-green-600 dark:text-[#22C55E]"
              title={`Mes comptes (en ${accounts.base})`}
              hint={`Total : ${formatAmount(accounts.total)}${accounts.unconvertible > 0 ? ` (${accounts.unconvertible} compte(s) dans une devise inconnue, non comptés)` : ''}`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {accounts.accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-[#334155] p-4">
                  <span className="font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate">{a.bankName}</span>
                  <span className="text-right text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] shrink-0">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: a.currency }).format(a.balance)}
                    {a.currency !== accounts.base && a.balanceInBase !== null && (
                      <span className="block text-xs font-normal text-gray-500 dark:text-[#94A3B8]">≈ {formatAmount(a.balanceInBase)}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {aiReady && (
          <section className={`${CARD} bg-gradient-to-br from-white dark:from-[#1E293B] to-[#EFF6FF] dark:to-[#1E40AF]/30`}>
            <SectionTitle
              icon={MdAutoAwesome}
              tone="bg-violet-100 text-violet-600"
              title="Poser une question à l’assistant"
              hint="Seuls des totaux par mois et par catégorie (3 derniers mois) sont envoyés à l’IA, pas tes libellés."
            />
            <form onSubmit={ask} className="flex gap-2 flex-wrap">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                placeholder="Ex : combien j’ai dépensé en courses le mois dernier ?"
                className="flex-1 min-w-[220px] border border-gray-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                required
              />
              <button disabled={asking} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:opacity-50">
                <MdSend /> {asking ? 'Réflexion…' : 'Demander'}
              </button>
            </form>
            {answer && <p className="mt-4 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] p-4 text-sm whitespace-pre-line text-[#0F172A] dark:text-[#F8FAFC]">{answer}</p>}
            {askError && <p className="mt-3 text-sm text-red-600 dark:text-[#F87171]">{askError}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
