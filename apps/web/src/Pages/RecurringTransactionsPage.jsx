import React, { useState } from "react";
import { Link } from "react-router-dom";

const initialTransactions = [
  { id: 1, title: "Abonnement Netflix", frequency: "Mensuel", amount: 12.99, category: "Divertissement", nextDue: "2024-07-15", status: "Actif" },
  { id: 2, title: "Loyer Appartement", frequency: "Mensuel", amount: 1200.0, category: "Logement", nextDue: "2024-08-01", status: "Actif" },
  { id: 3, title: "Assurance auto", frequency: "Semestriel", amount: 350.5, category: "Assurance", nextDue: "2024-09-20", status: "En attente" },
  { id: 4, title: "Abonnement Gym", frequency: "Mensuel", amount: 45.0, category: "Santé", nextDue: "2024-07-05", status: "Actif" },
  { id: 5, title: "Remboursement Prêt Étudiant", frequency: "Mensuel", amount: 250.0, category: "Remboursement de dette", nextDue: "2024-07-10", status: "Actif" },
  { id: 6, title: "Service de streaming musical", frequency: "Mensuel", amount: 9.99, category: "Divertissement", nextDue: "2024-07-25", status: "Actif" },
];
const categories = [
  "Divertissement",
  "Logement",
  "Assurance",
  "Santé",
  "Remboursement de dette",
  "Autre",
];
const statusColors = {
  "Actif": "bg-[#22C55E]/20 text-[#22C55E]",
  "En attente": "bg-[#1E40AF]/20 text-[#1E40AF]",
};

export default function RecurringTransactionsPage() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) &&
      (!categoryFilter || t.category === categoryFilter)
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#F5F7FA] py-8 px-6 hidden md:block">
          <div className="mb-8">
            <div className="text-xs text-[#6C757D] font-semibold mb-2">NAVIGATION</div>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Tableau de bord</Link></li>
              <li><Link to="/categories" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Catégories & Portefeuilles</Link></li>
              <li><Link to="/budgets" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Budgets</Link></li>
              <li><Link to="/transactions" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Transactions</Link></li>
              <li><Link to="/reports" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Rapports</Link></li>
              <li><Link to="/importexport" className="block px-2 py-1 rounded bg-[#F5F7FA] text-[#1E73BE] font-semibold">Import/Export</Link></li>
              <li><Link to="/forecasts" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Prévisions</Link></li>
              <li><Link to="/notifications" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Notifications</Link></li>
              <li><Link to="/settings" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Paramètres utilisateur</Link></li>
              <li><Link to="/profile" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Mon Profil</Link></li>
            </ul>
          </div>
          <Link to="/login" className="mt-8 w-full bg-[#1E73BE] text-white px-6 py-2 rounded font-semibold hover:bg-[#155a8a] flex items-center gap-2">
            <span className="text-lg">⏻</span> Déconnexion
          </Link>
        </aside>
        {/* Main */}
        <main className="flex-1 px-12 py-10 flex flex-col">
          <h1 className="text-3xl font-extrabold text-[#22292F] mb-8">Transactions récurrentes</h1>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <button className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5 py-2 rounded-lg shadow transition w-fit">
              Ajouter une nouvelle transaction
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Rechercher des transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE] w-72"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]"
              >
                <option value="">Filtrer par catégorie</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#EAF4FB] bg-white shadow">
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-[#F5F7FA]">
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Nom de la transaction</th>
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Fréquence</th>
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Montant</th>
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Catégorie</th>
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Prochaine échéance</th>
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Statut</th>
                  <th className="px-4 py-3 text-left text-[#343A40] font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="even:bg-white odd:bg-[#F5F7FA]">
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3">{t.frequency}</td>
                    <td className="px-4 py-3">{t.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
                    <td className="px-4 py-3">{t.category}</td>
                    <td className="px-4 py-3">{t.nextDue}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[t.status] || "bg-gray-200 text-gray-700"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-4">
                      <button className="text-[#1E73BE] hover:underline text-sm">Modifier</button>
                      <button className="text-[#6C757D] hover:underline text-sm">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-col md:flex-row items-center justify-between gap-2 mt-8 text-[#6C757D] text-sm">
            <div className="flex gap-6">
              <span>Ressources</span>
              <span>Légal</span>
              <span>Communauté</span>
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
    </div>
  );
}
