import React from "react";
import logo from "../assets/logo.jpg";
import DashboardHeader from "../components/DashboardHeader.jsx";

export default function ServerErrorPage() {
  const handleReload = () => {
    window.location.reload();
  };
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DashboardHeader />
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md flex flex-col items-center p-8 mt-8">
        <img src={logo} alt="MyBudget+" className="h-10 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">500 - Erreur interne</h1>
        <p className="text-gray-500 mb-6">Quelque chose s’est mal passé. Réessayez plus tard.</p>
        <button onClick={handleReload} className="px-5 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded font-semibold transition-colors">
          Rafraîchir la page
        </button>
      </div>
      <footer className="mt-8 text-gray-400 text-sm">© 2025 MyBudget+</footer>
    </div>
  );
}
