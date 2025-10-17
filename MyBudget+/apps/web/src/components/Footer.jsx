import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MdEmail, MdPhone, MdLocationOn 
} from 'react-icons/md';
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaGithub 
} from 'react-icons/fa';

/**
 * Composant Footer professionnel et moderne
 * Utilisable dans toute l'application
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-white to-[#F5F7FA] border-t border-[#EAF4FB] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Partie principale du footer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E73BE] to-[#155A8A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M+</span>
              </div>
              <span className="text-[#1E73BE] font-bold text-xl">MyBudget+</span>
            </div>
            <p className="text-[#6C757D] text-sm leading-relaxed">
              Gérez vos finances personnelles avec simplicité et efficacité. 
              Suivez vos dépenses, créez des budgets et atteignez vos objectifs financiers.
            </p>
          </div>

          {/* Navigation rapide */}
          <div>
            <h3 className="text-[#22292F] font-semibold mb-4 text-sm uppercase tracking-wide">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link to="/transactions" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Transactions
                </Link>
              </li>
              <li>
                <Link to="/budgets" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Budgets
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Rapports
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-[#22292F] font-semibold mb-4 text-sm uppercase tracking-wide">
              Ressources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-[#6C757D] hover:text-[#1E73BE] text-sm transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#22292F] font-semibold mb-4 text-sm uppercase tracking-wide">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[#6C757D] text-sm">
                <MdEmail size={18} className="text-[#1E73BE]" />
                <a href="mailto:contact@mybudgetplus.com" className="hover:text-[#1E73BE] transition-colors">
                  contact@mybudgetplus.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-[#6C757D] text-sm">
                <MdPhone size={18} className="text-[#1E73BE]" />
                <a href="tel:+33123456789" className="hover:text-[#1E73BE] transition-colors">
                  +33 1 23 45 67 89
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#6C757D] text-sm">
                <MdLocationOn size={18} className="text-[#1E73BE] mt-0.5" />
                <span>Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-[#EAF4FB] pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-[#6C757D] text-sm">
              © {currentYear} MyBudget+. Tous droits réservés.
            </div>

            {/* Liens légaux */}
            <div className="flex gap-6 text-[#6C757D] text-sm">
              <a href="#" className="hover:text-[#1E73BE] transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="hover:text-[#1E73BE] transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-[#1E73BE] transition-colors">
                Mentions légales
              </a>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#6C757D] hover:bg-[#1E73BE] hover:text-white transition-all"
                aria-label="Facebook"
              >
                <FaFacebook size={18} />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#6C757D] hover:bg-[#1E73BE] hover:text-white transition-all"
                aria-label="Twitter"
              >
                <FaTwitter size={18} />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#6C757D] hover:bg-[#1E73BE] hover:text-white transition-all"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={18} />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#6C757D] hover:bg-[#1E73BE] hover:text-white transition-all"
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#6C757D] hover:bg-[#1E73BE] hover:text-white transition-all"
                aria-label="GitHub"
              >
                <FaGithub size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

