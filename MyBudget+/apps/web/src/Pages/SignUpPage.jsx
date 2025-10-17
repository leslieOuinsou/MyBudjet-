import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUpPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de l'inscription");
      }
      setSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md flex flex-col md:flex-row overflow-hidden">
          {/* Formulaire */}
          <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
            <div className="flex flex-col items-center mb-8">
              <img src="/vite.svg" alt="MyBudget+ Logo" className="h-10 mb-2" />
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                <span className="text-blue-600">MyBudget</span><span className="text-blue-400">+</span>
              </h1>
              <h2 className="text-xl font-semibold mt-2 mb-1">Créer un compte</h2>
              <p className="text-gray-500 text-center text-sm">
                Lancez-vous avec MyBudget+ pour gérer vos finances.
              </p>
            </div>
            {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
            {success && <div className="mb-4 text-green-600 text-center">{success}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input type="text" placeholder="John" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                  <input type="text" placeholder="Doe" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
                <input type="email" placeholder="john.doe@exemple.com" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <input type="password" placeholder="Votre mot de passe" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input type="password" placeholder="Confirmez votre mot de passe" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md mt-2 transition-colors">
                S'inscrire
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              En cliquant sur "S'inscrire", vous reconnaissez que vous recevrez des mises à jour de MyBudget+ et que vous avez lu et accepté notre{' '}
              <a href="#" className="text-blue-600 font-medium underline">Politique de confidentialité</a>.
            </p>
            <p className="text-sm text-gray-700 mt-4 text-center">
              Vous avez déjà un compte ?{' '}
              <a href="/login" className="text-blue-600 font-semibold hover:underline">Se connecter</a>
            </p>
          </div>
          {/* Témoignage */}
          <div className="hidden md:flex w-1/2 bg-gray-50 flex-col items-center justify-center p-10 border-l border-gray-100">
            <div className="flex flex-col items-center">
              <img src="/public/images/people/user1.png" alt="Utilisateur" className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow" />
              <blockquote className="text-lg text-center font-medium text-gray-800 mb-2">
                « MyBudget+ a transformé la façon dont je gère mes finances. C'est intuitif, puissant et me fait gagner un temps précieux. »
              </blockquote>
              <div className="text-sm text-gray-500 mb-6">Alice Dubois, Analyste Financière</div>
              <div className="text-xs text-gray-400 tracking-wide mb-2 text-center">APPROUVÉ PAR DES EXPERTS EN FINANCE</div>
              <div className="flex gap-6 justify-center items-center opacity-60">
                {/* Placeholders logos experts */}
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" stroke="#A0AEC0" strokeWidth="2" /></svg>
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" rx="5" stroke="#A0AEC0" strokeWidth="2" /></svg>
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" stroke="#A0AEC0" strokeWidth="2" /></svg>
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><polygon points="16,6 26,26 6,26" stroke="#A0AEC0" strokeWidth="2" fill="none" /></svg>
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><path d="M16 6v20M6 16h20" stroke="#A0AEC0" strokeWidth="2" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-xs text-gray-400 text-left p-4 pl-8">Made with <span className="text-purple-600 font-bold">♥</span> by MyBudget+</footer>
    </div>
  );
};

export default SignUpPage;
