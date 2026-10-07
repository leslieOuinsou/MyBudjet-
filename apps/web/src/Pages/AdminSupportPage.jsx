import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { MdArrowBack, MdEmail, MdPhone, MdHelp, MdBugReport } from 'react-icons/md';

export default function AdminSupportPage() {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
      <AdminHeader />
      
      <div className="flex flex-1">
        <AdminSidebar />
        
        {/* Main Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/admin" className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-gray-300 hover:bg-[#334155]' : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]'}`}>
              <MdArrowBack size={24} />
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
                Support & Contact
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                Informations de contact et support technique
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-[#1E40AF]/50 rounded-lg">
                  <MdEmail size={24} className="text-blue-600 dark:text-[#60A5FA]" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Email Support</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>support@mybudget.com</p>
                </div>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                Pour toute question ou assistance, contactez-nous par email. Temps de réponse : 24-48h.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-[#14532D]/50 rounded-lg">
                  <MdPhone size={24} className="text-green-600 dark:text-[#22C55E]" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Téléphone</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>+33 1 23 45 67 89</p>
                </div>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                Support téléphonique disponible du lundi au vendredi, 9h-18h.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-[#78350F]/50 rounded-lg">
                  <MdHelp size={24} className="text-yellow-600 dark:text-[#FBBF24]" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Documentation</h3>
                  <Link to="/admin/faq" className="text-sm text-[#2563EB] dark:text-[#60A5FA] hover:underline">Voir la FAQ</Link>
                </div>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                Consultez notre documentation complète et nos guides d'utilisation.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-[#7F1D1D]/50 rounded-lg">
                  <MdBugReport size={24} className="text-red-600 dark:text-[#F87171]" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Signaler un Bug</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>bugs@mybudget.com</p>
                </div>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                Signalez les bugs et problèmes techniques pour améliorer la plateforme.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

