import React, { useState, useEffect, useCallback } from 'react';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
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

  return (
    <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-gray-900">
      <DashboardSidebar />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#2C3E50] dark:text-white">Défis d’épargne</h1>
        {error && <p className="text-red-600">{error}</p>}
        {loading && <p className="text-gray-500">Chargement…</p>}

        {goals.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#2C3E50] dark:text-white">Mes défis en cours</h2>
            {goals.map((goal) => {
              const challenge = findChallenge(goal);
              if (!challenge) return null;
              const step = expectedStep(challenge, goal.createdAt);
              const shouldHave = cumulative(challenge, step);
              const gap = shouldHave - goal.currentAmount;
              const nextAmount = challenge.stepAmount(step);
              return (
                <div key={goal._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold text-[#2C3E50] dark:text-white">{challenge.title}</div>
                      <div className="text-sm text-gray-500">
                        {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)} · {challenge.unit} {step}/{challenge.steps}
                      </div>
                    </div>
                    <button onClick={() => remove(goal)} className="text-sm text-red-600 hover:underline">Abandonner</button>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mt-3">
                    <div className="h-2 bg-[#1E73BE] rounded" style={{ width: `${goal.percentage}%` }} />
                  </div>
                  {goal.achieved ? (
                    <p className="mt-3 text-green-600 font-medium">Défi réussi, bravo !</p>
                  ) : (
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                      <span className={gap > 0 ? 'text-orange-500' : 'text-green-600'}>
                        {gap > 0 ? `${formatAmount(gap)} de retard sur le rythme` : 'Tu es à jour'}
                      </span>
                      <button
                        onClick={() => deposit(goal, gap > 0 ? gap : nextAmount)}
                        className="px-3 py-1.5 rounded-lg bg-[#1E73BE] text-white hover:opacity-90"
                      >
                        Épargner {formatAmount(gap > 0 ? gap : nextAmount)}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#2C3E50] dark:text-white">Choisir un défi</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {CHALLENGES.map((c) => (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col">
                <div className="font-semibold text-[#2C3E50] dark:text-white">{c.title}</div>
                <p className="text-sm text-gray-500 mt-1 flex-1">{c.description}</p>
                <button
                  disabled={activeIds.has(c.id)}
                  onClick={() => start(c)}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-[#1E73BE] text-white disabled:opacity-40"
                >
                  {activeIds.has(c.id) ? 'Déjà en cours' : 'Commencer'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
