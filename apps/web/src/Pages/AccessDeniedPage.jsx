import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { MdLock, MdHome, MdLogin, MdAdminPanelSettings } from "react-icons/md";

export default function AccessDeniedPage() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-4">
            <MdLock className="text-white text-2xl" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Accès refusé
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page
          </p>
        </div>

        {/* Contenu */}
        <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Que pouvez-vous faire ?
          </h2>
          <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Vérifiez que vous êtes connecté avec le bon compte
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Contactez un administrateur si vous pensez qu'il s'agit d'une erreur
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Utilisez un compte administrateur pour accéder aux fonctions d'administration
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <Link
            to="/login"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <MdLogin size={20} />
            Se connecter
          </Link>

          <Link
            to="/admin/login"
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <MdAdminPanelSettings size={20} />
            Connexion Admin
          </Link>

          <Link
            to="/"
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <MdHome size={20} />
            Retour à l'accueil
          </Link>
        </div>

        {/* Informations de sécurité */}
        <div className={`mt-8 p-4 rounded-lg text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
          <div className="flex items-start gap-2">
            <MdLock className="text-red-500 mt-0.5" size={16} />
            <div>
              <p className="font-semibold mb-1">Sécurité :</p>
              <ul className="space-y-1 text-xs">
                <li>• Les tentatives d'accès non autorisées sont enregistrées</li>
                <li>• Contactez le support si vous avez des questions</li>
                <li>• Utilisez uniquement vos propres identifiants</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
