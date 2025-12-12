import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from '../components/DashboardSidebar.jsx';

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); setSent(true); };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-12 py-10 flex flex-col">
          <h1 className="text-3xl font-extrabold text-[#22292F] mb-8">Support & Contact</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="col-span-1 bg-white rounded-xl shadow p-8 border border-[#EAF4FB]">
              <h2 className="text-xl font-bold text-[#22292F] mb-2">Contactez-nous</h2>
              <p className="text-[#6C757D] mb-4 text-sm">Décrivez votre problème et nous vous aiderons.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Entrez votre nom" className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" required />
                <input name="email" value={form.email} onChange={handleChange} placeholder="contact@exemple.com" className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" required />
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="Concernant votre facture..." className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" required />
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Décrivez votre problème ou votre question ici." rows={4} className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" required />
                <button type="submit" className="mt-2 px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded font-semibold" disabled={sent}>{sent ? "Message envoyé !" : "Envoyer le message"}</button>
              </form>
            </div>
            {/* Support immédiat */}
            <div className="col-span-1 flex flex-col gap-6">
              <div className="bg-white rounded-xl shadow p-8 border border-[#EAF4FB] mb-2">
                <h2 className="text-lg font-bold text-[#22292F] mb-2">Besoin d'aide immédiate ?</h2>
                <p className="text-[#6C757D] mb-4 text-sm">Choisissez une option pour un support rapide.</p>
                <button className="w-full border border-[#EAF4FB] bg-white hover:bg-[#F5F7FA] text-[#22292F] rounded font-semibold px-4 py-2 mb-2 flex items-center justify-center gap-2"><span>💬</span> Chat en direct</button>
                <button className="w-full border border-[#EAF4FB] bg-white hover:bg-[#F5F7FA] text-[#22292F] rounded font-semibold px-4 py-2 flex items-center justify-center gap-2"><span>✉️</span> Support par e-mail</button>
              </div>
              {/* FAQ */}
              <div className="bg-white rounded-xl shadow p-8 border border-[#EAF4FB]">
                <h2 className="text-lg font-bold text-[#22292F] mb-2">Questions Fréquemment Posées</h2>
                <p className="text-[#6C757D] mb-4 text-sm">Trouvez des réponses rapides à nos questions les plus courantes.</p>
                <a href="#" className="text-[#22C55E] font-semibold mb-2 inline-block">Voir toutes les FAQ</a>
                <div className="divide-y divide-[#EAF4FB]">
                  <div className="py-2"><span className="font-semibold">Comment puis-je ajouter une nouvelle facture ?</span></div>
                  <div className="py-2"><span className="font-semibold">Comment fonctionne le suivi des transactions récurrentes ?</span></div>
                  <div className="py-2"><span className="font-semibold">Quelles sont les options de mon compte ?</span></div>
                </div>
              </div>
            </div>
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
