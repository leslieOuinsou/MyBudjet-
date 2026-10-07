import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getSubscriptions, getHealthScore, getAccountsSummary, getAiStatus, askAssistant } from '../api.js';

import { formatMoney } from '../lib/format.js';
const FREQUENCY_LABELS = { weekly: 'Hebdo', monthly: 'Mensuel', yearly: 'Annuel' };
const LEVEL_STYLES = {
  excellent: 'text-green-600',
  bon: 'text-blue-600',
  moyen: 'text-orange-500',
  fragile: 'text-red-600',
};
const BREAKDOWN_LABELS = {
  savings: 'Épargne',
  budgets: 'Budgets respectés',
  goals: 'Objectifs',
  tracking: 'Suivi régulier',
};

const LEVEL_COLORS = { excellent: '#0CA30C', bon: '#2A78D6', moyen: '#C98500', fragile: '#D03B3B' };
const BAR_COLORS = { savings: '#2A78D6', budgets: '#EB6834', goals: '#1BAF7A', tracking: '#EDA100' };

// Jauge circulaire : l'arc part du haut et se remplit au prorata du score
function ScoreRing({ score, level }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const color = LEVEL_COLORS[level] || '#2A78D6';
  return (
    <div className="relative w-36 h-36 shrink-0" role="img" aria-label={`Score ${score} sur 100, niveau ${level}`}>
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#ECEBE8" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[#22292F] leading-none">{score}</span>
        <span className="text-xs text-gray-500 mt-1">sur 100 · {level}</span>
      </div>
    </div>
  );
}

const formatAmount = (n) => formatMoney(n);

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
    <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-gray-900">
      <DashboardSidebar />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#2C3E50] dark:text-white">Analyse financière</h1>

        {loading && <p className="text-gray-500">Chargement…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {health && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-[#2C3E50] dark:text-white">Score de santé financière</h2>
            <div className="flex items-center gap-6 flex-wrap">
              <ScoreRing score={health.score} level={health.level} />
              <div className="flex-1 min-w-[240px] space-y-3">
                {Object.entries(health.breakdown).map(([key, { points, max }]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>{BREAKDOWN_LABELS[key]}</span>
                      <span>{points}/{max}</span>
                    </div>
                    <div className="h-2 bg-[#ECEBE8] rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded"
                        style={{ width: `${(points / max) * 100}%`, backgroundColor: BAR_COLORS[key], transition: 'width 700ms ease' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {health.tips.length > 0 && (
              <ul className="mt-4 list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {health.tips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            )}
          </section>
        )}

        {subs && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-1 text-[#2C3E50] dark:text-white">Abonnements détectés</h2>
            <p className="text-sm text-gray-500 mb-4">
              {subs.subscriptions.length > 0
                ? `${formatAmount(subs.totalMonthly)} par mois, soit ${formatAmount(subs.totalYearly)} par an.`
                : 'Aucun abonnement détecté. Il faut au moins 3 paiements réguliers du même libellé.'}
            </p>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {subs.subscriptions.map((s) => (
                <div key={s.key} className="py-3 flex justify-between gap-4">
                  <div>
                    <div className="font-medium text-[#2C3E50] dark:text-white">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {FREQUENCY_LABELS[s.frequency]} · {s.occurrences} paiements{s.category ? ` · ${s.category}` : ''}
                    </div>
                    <div className="h-1.5 mt-2 w-48 max-w-full bg-[#ECEBE8] rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-[#2A78D6]"
                        style={{ width: `${Math.max(4, (s.yearlyCost / subs.subscriptions[0].yearlyCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <div className="font-semibold">{formatAmount(s.amount)}</div>
                    <div className="text-xs text-gray-500">{formatAmount(s.yearlyCost)} / an</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {accounts && accounts.accounts.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-1 text-[#2C3E50] dark:text-white">Mes comptes (en {accounts.base})</h2>
            <p className="text-sm text-gray-500 mb-4">
              Total : {formatAmount(accounts.total)}
              {accounts.unconvertible > 0 && ` (${accounts.unconvertible} compte(s) dans une devise inconnue, non comptés)`}
            </p>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {accounts.accounts.map((a) => (
                <div key={a.id} className="py-2 flex justify-between text-sm dark:text-white">
                  <span>{a.bankName}</span>
                  <span>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: a.currency }).format(a.balance)}
                    {a.currency !== accounts.base && a.balanceInBase !== null && (
                      <span className="text-gray-500"> ≈ {formatAmount(a.balanceInBase)}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {aiReady && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-1 text-[#2C3E50] dark:text-white">Poser une question à l’assistant</h2>
            <p className="text-xs text-gray-500 mb-3">
              Seuls des totaux par mois et par catégorie (3 derniers mois) sont envoyés à l’IA, pas tes libellés.
            </p>
            <form onSubmit={ask} className="flex gap-2 flex-wrap">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                placeholder="Ex : combien j’ai dépensé en courses le mois dernier ?"
                className="flex-1 min-w-[220px] border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                required
              />
              <button disabled={asking} className="px-4 py-2 rounded-lg bg-[#1E73BE] text-white text-sm disabled:opacity-50">
                {asking ? 'Réflexion…' : 'Demander'}
              </button>
            </form>
            {answer && <p className="mt-3 text-sm whitespace-pre-line text-[#2C3E50] dark:text-gray-200">{answer}</p>}
            {askError && <p className="mt-3 text-sm text-red-600">{askError}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
