import React from "react";
import logo from "../assets/logo.jpg";

export default function ServerErrorPage() {
  const handleReload = () => {
    window.location.reload();
  };
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A] flex flex-col">
      <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-md flex flex-col items-center p-8 mt-8">
        <img src={logo} alt="MyBudget+" className="h-10 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-[#F8FAFC] mb-2">500 - Erreur interne</h1>
        <p className="text-gray-500 dark:text-[#94A3B8] mb-6">Quelque chose s’est mal passé. Réessayez plus tard.</p>
        <button onClick={handleReload} className="px-5 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded font-semibold transition-colors">
          Rafraîchir la page
        </button>
      </div>
    </div>
  );
}
