import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MdEmail, 
  MdPhone, 
  MdLocationOn,
  MdDashboard,
  MdReceipt,
  MdAccountBalance,
  MdBarChart,
  MdSecurity,
  MdVerified,
  MdTrendingUp
} from 'react-icons/md';
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram, 
  FaGithub,
  FaArrowRight
} from 'react-icons/fa';

/**
 * Composant Footer moderne et professionnel
 * Design épuré avec animations et gradients
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // TODO: Implémenter l'inscription à la newsletter
    console.log('Newsletter signup:', email);
    setEmail('');
    alert('Merci pour votre inscription !');
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-50 dark:from-[#0F172A] via-white dark:via-[#1E293B] to-gray-50 dark:to-[#0F172A] border-t-2 border-gray-100 dark:border-[#334155] mt-auto overflow-hidden">
      {/* Pattern décoratif en arrière-plan */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #2563EB 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Partie principale du footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Logo et description */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2563EB] dark:from-[#3B82F6] via-[#1D4ED8] dark:via-[#2563EB] to-[#1E40AF] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">M+</span>
              </div>
              <span className="text-[#2563EB] dark:text-[#60A5FA] font-bold text-2xl bg-gradient-to-r from-[#2563EB] dark:from-[#3B82F6] to-[#1D4ED8] dark:to-[#2563EB] bg-clip-text text-transparent">
                MyBudget+
              </span>
            </Link>
            <p className="text-gray-600 dark:text-[#CBD5E1] text-sm leading-relaxed mb-6">
              Gérez vos finances personnelles avec simplicité et efficacité. 
              Suivez vos dépenses, créez des budgets et atteignez vos objectifs financiers.
            </p>
            
            {/* Badges de confiance */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-[#14532D]/30 border border-green-200 dark:border-[#166534] rounded-full">
                <MdSecurity className="text-green-600 dark:text-[#22C55E]" size={14} />
                <span className="text-xs font-medium text-green-700 dark:text-[#4ADE80]">Sécurisé</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-[#1E40AF]/25 border border-blue-200 dark:border-[#1E40AF] rounded-full">
                <MdVerified className="text-blue-600 dark:text-[#60A5FA]" size={14} />
                <span className="text-xs font-medium text-blue-700 dark:text-[#60A5FA]">Vérifié</span>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] flex items-center justify-center text-gray-600 dark:text-[#CBD5E1] hover:bg-[#2563EB] dark:hover:bg-[#3B82F6] hover:text-white hover:border-[#2563EB] transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Facebook"
              >
                <FaFacebook size={16} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] flex items-center justify-center text-gray-600 dark:text-[#CBD5E1] hover:bg-[#2563EB] dark:hover:bg-[#3B82F6] hover:text-white hover:border-[#2563EB] transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Twitter"
              >
                <FaTwitter size={16} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] flex items-center justify-center text-gray-600 dark:text-[#CBD5E1] hover:bg-[#2563EB] dark:hover:bg-[#3B82F6] hover:text-white hover:border-[#2563EB] transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={16} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] flex items-center justify-center text-gray-600 dark:text-[#CBD5E1] hover:bg-[#2563EB] dark:hover:bg-[#3B82F6] hover:text-white hover:border-[#2563EB] transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Instagram"
              >
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          {/* Navigation rapide */}
          <div>
            <h3 className="text-gray-900 dark:text-[#F8FAFC] font-bold mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
              <MdDashboard className="text-[#2563EB] dark:text-[#60A5FA]" size={18} />
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 group"
                >
                  <MdDashboard size={16} className="group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors" />
                  <span>Tableau de bord</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/transactions" 
                  className="flex items-center gap-2 text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 group"
                >
                  <MdReceipt size={16} className="group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors" />
                  <span>Transactions</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/budgets" 
                  className="flex items-center gap-2 text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 group"
                >
                  <MdAccountBalance size={16} className="group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors" />
                  <span>Budgets</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports" 
                  className="flex items-center gap-2 text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 group"
                >
                  <MdBarChart size={16} className="group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors" />
                  <span>Rapports</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/forecasts" 
                  className="flex items-center gap-2 text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 group"
                >
                  <MdTrendingUp size={16} className="group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors" />
                  <span>Prévisions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-gray-900 dark:text-[#F8FAFC] font-bold mb-6 text-sm uppercase tracking-wider">
              Ressources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-600 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-gray-900 dark:text-[#F8FAFC] font-bold mb-6 text-sm uppercase tracking-wider">
              Newsletter
            </h3>
            <p className="text-gray-600 dark:text-[#CBD5E1] text-sm mb-4">
              Recevez nos dernières actualités et conseils financiers directement dans votre boîte mail.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-gray-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-[#2563EB] dark:from-[#3B82F6] to-[#1D4ED8] dark:to-[#2563EB] text-white rounded-lg hover:from-[#1D4ED8] dark:hover:from-[#2563EB] hover:to-[#1E40AF] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
                >
                  <FaArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Section Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 p-6 bg-gradient-to-r from-[#DBEAFE] dark:from-[#1E40AF] to-[#BFDBFE] dark:to-[#1E40AF] rounded-2xl border border-[#2563EB]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-xl flex items-center justify-center shadow-md">
              <MdEmail className="text-[#2563EB] dark:text-[#60A5FA]" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wide mb-1">Email</div>
              <a href="mailto:contact@mybudgetplus.com" className="text-gray-900 dark:text-[#F8FAFC] font-semibold hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors text-sm">
                contact@mybudgetplus.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-xl flex items-center justify-center shadow-md">
              <MdPhone className="text-[#2563EB] dark:text-[#60A5FA]" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wide mb-1">Téléphone</div>
              <a href="tel:+33123456789" className="text-gray-900 dark:text-[#F8FAFC] font-semibold hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors text-sm">
                +33 1 23 45 67 89
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-xl flex items-center justify-center shadow-md">
              <MdLocationOn className="text-[#2563EB] dark:text-[#60A5FA]" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wide mb-1">Adresse</div>
              <span className="text-gray-900 dark:text-[#F8FAFC] font-semibold text-sm">Paris, France</span>
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t-2 border-gray-100 dark:border-[#334155] pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-gray-600 dark:text-[#CBD5E1] text-sm flex items-center gap-2">
              <span>© {currentYear} MyBudget+.</span>
              <span className="hidden sm:inline">Tous droits réservés.</span>
            </div>

            {/* Liens légaux */}
            <div className="flex flex-wrap gap-4 lg:gap-6 justify-center text-gray-600 dark:text-[#CBD5E1] text-sm">
              <Link 
                to="/privacy-policy" 
                className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors font-medium"
              >
                Confidentialité
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors font-medium"
              >
                Gérer les cookies
              </button>
              <a 
                href="#" 
                className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors font-medium"
              >
                Conditions
              </a>
              <a 
                href="#" 
                className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors font-medium"
              >
                Mentions légales
              </a>
              <Link 
                to="/faq" 
                className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors font-medium"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

