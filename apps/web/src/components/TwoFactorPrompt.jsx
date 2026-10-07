import React, { useState } from 'react';

// Étape « code reçu par email » affichée après un mot de passe correct quand la 2FA est activée.
export default function TwoFactorPrompt({ emailHint, devCode, loading, onSubmit, onCancel }) {
  const [code, setCode] = useState('');

  return (
    <form
      className="flex flex-col gap-3 md:gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
      }}
    >
      <p className="text-sm text-[#343A40]">
        Un code de sécurité à 6 chiffres a été envoyé à <strong>{emailHint}</strong>. Il est valable 10 minutes.
      </p>
      {devCode && (
        <p className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-2">
          Mode développement (email non configuré) : votre code est <strong>{devCode}</strong>
        </p>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#1E73BE]"
        autoFocus
        required
      />
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-[#1E3A8A] text-white font-semibold py-3 rounded-xl hover:bg-[#155a8a] disabled:opacity-50 text-sm md:text-base"
      >
        {loading ? 'Vérification…' : 'Valider le code'}
      </button>
      <button type="button" onClick={onCancel} className="text-sm text-[#6C757D] hover:underline">
        Retour à la connexion
      </button>
    </form>
  );
}
