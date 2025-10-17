import React from "react";
import logo from "../assets/logo.jpg";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center">
          <img src={logo} alt="MyBudget+" className="h-10 mb-4" />
          <h1 className="text-2xl font-bold mb-1">MyBudget+</h1>
          <h2 className="text-lg font-semibold mb-2">Mot de passe oublié&nbsp;?</h2>
          <p className="text-gray-500 text-center mb-6">
            Entrez votre adresse e-mail ci-dessous et nous vous enverrons les instructions pour réinitialiser votre mot de passe.
          </p>
          <form className="w-full flex flex-col gap-4">
            <input
              type="email"
              placeholder="votre@email.com"
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
            />
            <button
              type="submit"
              className="w-full bg-[#1E73BE] text-white py-2 rounded-lg font-semibold"
            >
              Envoyer les instructions
            </button>
          </form>
          <a href="/login" className="mt-4 text-[#1E73BE] font-medium">Se connecter</a>
        </div>
      </div>
      <div className="fixed left-4 bottom-2 text-xs text-gray-400">
        Made with <span className="text-[#1E73BE]">❤️</span>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
