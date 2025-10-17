import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="mb-2">
          <span className="inline-block text-3xl font-bold text-[#1E73BE] align-middle mr-2">✴️</span>
          <span className="text-2xl font-extrabold text-[#1E73BE] align-middle">MyBudget+</span>
        </div>
        <div className="relative flex flex-col items-center">
          <span className="absolute text-[10rem] font-extrabold text-[#EAF4FB] select-none -z-10" style={{top: '-3.5rem'}}>404</span>
          <h1 className="text-4xl font-extrabold text-[#22292F] mb-2">Page introuvable</h1>
          <p className="text-[#6C757D] mb-6 max-w-md text-center">
            Oups ! La page que vous recherchez n'existe pas. Elle a peut-être été supprimée, renommée ou est temporairement indisponible.
          </p>
          <div className="flex gap-3 mb-8">
            <Link to="/" className="px-5 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded font-semibold transition">Retour à l'accueil</Link>
            <Link to="/support" className="px-5 py-2 border border-[#EAF4FB] bg-white hover:bg-[#F5F7FA] text-[#22292F] rounded font-semibold transition">Contacter le support</Link>
          </div>
        </div>
        <div className="flex gap-2 mt-8">
          <button className="px-4 py-2 bg-[#22C55E] text-white rounded font-semibold">Afficher 404</button>
          <button className="px-4 py-2 border border-[#EAF4FB] bg-white text-[#22292F] rounded font-semibold">Afficher 500</button>
          <button className="px-4 py-2 border border-[#EAF4FB] bg-white text-[#22292F] rounded font-semibold">Afficher Accès Refusé</button>
        </div>
      </div>
    </div>
  );
}
