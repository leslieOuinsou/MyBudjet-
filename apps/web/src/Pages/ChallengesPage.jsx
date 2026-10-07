import React, { useState, useEffect, useCallback } from 'react';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { MdEmojiEvents, MdSavings, MdFlag, MdLocalFireDepartment, MdCheckCircle, MdTimeline } from 'react-icons/md';
import { getGoals, addGoal, updateGoal, deleteGoal } from '../api.js';

import { formatMoney } from '../lib/format.js';
// Les défis sont des objectifs d'épargne (FinancialGoal) dont le nom commence par ce préfixe.
const PREFIX = '[Défi] ';

const CHALLENGES = [
  {
    id: 'weeks52',
    title: 'Défi des 52 semaines',
    description: '1 € la semaine 1, 2 € la semaine 2… jusqu’à 52 €. Total : 1 378 €.',
    target: 1378,
    steps: 52,
    stepAmount: (n) => n,
    unit: 'semaine',
    days: 7,
    gradient: 'from-[#1E3A8A] to-[#1E73BE]',
    level: 'Progressif',
  },
  {
    id: 'roundup30',
    title: '30 jours, 1 € de plus par jour',
    description: '1 € le jour 1, 2 € le jour 2… jusqu’à 30 €. Total : 465 €.',
    target: 465,
    steps: 30,
    stepAmount: (n) => n,
    unit: 'jour',
    days: 1,
    gradient: 'from-[#1E73BE] to-[#4DA3E0]',
    level: 'Intense',
  },
  {
    id: 'fixed20',
    title: '20 € par semaine pendant 6 mois',
    description: 'Un montant fixe, simple à tenir. Total : 520 €.',
    target: 520,
    steps: 26,
    stepAmount: () => 20,
    unit: 'semaine',
    days: 7,
    gradient: 'from-[#28A745] to-[#5FCB78]',
    level: 'Régulier',
  },
];

const formatAmount = (n) => formatMoney(n);

const findChallenge = (goal) => CHALLENGES.find((c) => goal.name.startsWith(`${PREFIX}${c.title}`));

// Étape à laquelle l'utilisateur devrait être aujourd'hui
const expectedStep = (challenge, createdAt) => {
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / (challenge.days * 86400000));
  return Math.min(challenge.steps, elapsed + 1);
};

const cumulative = (challenge, step) =>
  Array.from({ length: step }, (_, i) => challenge.stepAmount(i + 1)).reduce((a, b) => a + b, 0);

export default function ChallengesPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const all = await getGoals();
      setGoals(all.filter((g) => g.name.startsWith(PREFIX)));
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const start = async (challenge) => {
    try {
      await addGoal({ name: `${PREFIX}${challenge.title}`, targetAmount: challenge.target, color: '#1E73BE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deposit = async (goal, amount) => {
    try {
      await updateGoal(goal._id, { currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount) });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (goal) => {
    if (!window.confirm('Abandonner ce défi ?')) return;
    try {
      await deleteGoal(goal._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeIds = new Set(goals.map((g) => findChallenge(g)?.id));
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const doneCount = goals.filter((g) => g.achieved).length;

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <DashboardSidebar />
      <main className="flex-1 p-5 md:p-10 space-y-8 max-w-6xl">
        <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#1E73BE] text-white p-6 md:p-8 shadow-sm flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl"><MdEmojiEvents /></span>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Défis d’épargne</h1>
            <p className="text-white/85 text-sm mt-1">Relève un défi, épargne un peu chaque semaine et regarde ta cagnotte grandir.</p>
          </div>
        </header>

        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {loading && (
          <div className="flex items-center gap-3 text-gray-500">
            <span className="h-5 w-5 rounded-full border-2 border-[#1E73BE] border-t-transparent animate-spin" /> Chargement…
          </div>
        )}

        {goals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: MdLocalFireDepartment, label: 'Défis en cours', value: goals.length - doneCount, tone: 'bg-orange-100 text-orange-600' },
              { icon: MdSavings, label: 'Déjà épargné', value: formatAmount(totalSaved), tone: 'bg-green-100 text-green-600' },
              { icon: MdFlag, label: 'Objectif cumulé', value: formatAmount(totalTarget), tone: 'bg-blue-100 text-blue-600' },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${tone}`}><Icon /></span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="text-xl font-extrabold text-[#22292F]">{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {goals.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#22292F]">Mes défis en cours</h2>
            {goals.map((goal) => {
              const challenge = findChallenge(goal);
              if (!challenge) return null;
              const step = expectedStep(challenge, goal.createdAt);
              const shouldHave = cumulative(challenge, step);
              const gap = shouldHave - goal.currentAmount;
              const nextAmount = challenge.stepAmount(step);
              const pct = Math.min(100, Math.round(goal.percentage || 0));
              return (
                <div key={goal._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${challenge.gradient}`} />
                  <div className="p-5 md:p-6">
                    <div className="flex justify-between flex-wrap gap-3">
                      <div>
                        <div className="font-bold text-lg text-[#22292F]">{challenge.title}</div>
                        <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <MdTimeline /> {challenge.unit} {step}/{challenge.steps}
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">{challenge.level}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-[#22292F]">{pct} %</div>
                        <div className="text-xs text-gray-500">{formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}</div>
                      </div>
                    </div>
                    <div className="h-3 bg-[#E9EEF5] rounded-full mt-4 overflow-hidden">
                      <div className={`h-3 rounded-full bg-gradient-to-r ${challenge.gradient}`} style={{ width: `${pct}%`, transition: 'width 700ms ease' }} />
                    </div>
                    {goal.achieved ? (
                      <p className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 font-semibold">
                        <MdCheckCircle /> Défi réussi, bravo !
                      </p>
                    ) : (
                      <div className="mt-4 flex items-center justify-between flex-wrap gap-3 text-sm">
                        <span className={`px-3 py-1.5 rounded-full font-medium ${gap > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {gap > 0 ? `${formatAmount(gap)} de retard sur le rythme` : 'Tu es à jour'}
                        </span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => remove(goal)} className="text-sm text-gray-500 hover:text-red-600">Abandonner</button>
                          <button
                            onClick={() => deposit(goal, gap > 0 ? gap : nextAmount)}
                            className={`px-4 py-2 rounded-xl bg-gradient-to-r ${challenge.gradient} text-white font-semibold hover:opacity-90`}
                          >
                            Épargner {formatAmount(gap > 0 ? gap : nextAmount)}
                          </button>
                        </div>
                      </div>
                    )}
                    {goal.achieved && (
                      <button onClick={() => remove(goal)} className="mt-3 text-sm text-gray-500 hover:text-red-600">Retirer ce défi</button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#22292F]">Choisir un défi</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {CHALLENGES.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className={`bg-gradient-to-br ${c.gradient} text-white p-5`}>
                  <MdEmojiEvents className="text-3xl mb-2" />
                  <div className="font-bold text-lg leading-snug">{c.title}</div>
                  <div className="text-white/85 text-xs mt-1">{c.level} · {c.steps} {c.unit}s</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-sm text-gray-600 flex-1">{c.description}</p>
                  <div className="mt-3 text-sm font-bold text-[#22292F]">Objectif : {formatAmount(c.target)}</div>
                  <button
                    disabled={activeIds.has(c.id)}
                    onClick={() => start(c)}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-[#1E73BE] text-white font-semibold hover:bg-[#155a8a] disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    {activeIds.has(c.id) ? 'Déjà en cours' : 'Commencer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
