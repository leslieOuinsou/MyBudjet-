import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { MdArrowBack, MdExpandMore, MdExpandLess, MdHelp } from 'react-icons/md';

export default function AdminFAQPage() {
  const { isDarkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    {
      category: 'Gestion des Utilisateurs',
      questions: [
        {
          q: 'Comment bloquer un utilisateur ?',
          a: 'Allez dans "Gestion utilisateurs", trouvez l\'utilisateur concerné et cliquez sur le bouton "Bloquer". L\'utilisateur ne pourra plus se connecter.'
        },
        {
          q: 'Comment supprimer un utilisateur ?',
          a: 'Dans la page "Gestion utilisateurs", cliquez sur "Supprimer" pour l\'utilisateur concerné. ⚠️ Cette action supprimera toutes les données de l\'utilisateur (transactions, budgets, etc.).'
        },
        {
          q: 'Comment changer le rôle d\'un utilisateur ?',
          a: 'Cliquez sur le badge de rôle (Admin/User) pour ouvrir le modal de modification. Vous pouvez changer un utilisateur standard en administrateur ou vice-versa.'
        }
      ]
    },
    {
      category: 'Rappels et Transactions',
      questions: [
        {
          q: 'Comment fonctionnent les rappels de factures ?',
          a: 'Les rappels de factures permettent aux utilisateurs d\'être notifiés avant l\'échéance. Le système envoie automatiquement des emails 3 jours avant la date d\'échéance.'
        },
        {
          q: 'Que sont les transactions récurrentes ?',
          a: 'Les transactions récurrentes sont des revenus ou dépenses qui se répètent automatiquement selon une fréquence définie (quotidienne, hebdomadaire, mensuelle ou annuelle).'
        },
        {
          q: 'Comment modifier la fréquence d\'une transaction récurrente ?',
          a: 'Les utilisateurs peuvent modifier leurs transactions récurrentes dans leur interface. Les administrateurs peuvent voir toutes les transactions mais ne peuvent pas les modifier directement.'
        }
      ]
    },
    {
      category: 'Statistiques et Rapports',
      questions: [
        {
          q: 'Comment interpréter les statistiques du tableau de bord ?',
          a: 'Le tableau de bord affiche : Total utilisateurs (inscrits), Total transactions (nombre total), Total budgets (créés), Total rappels (actifs). Ces chiffres sont mis à jour en temps réel.'
        },
        {
          q: 'Puis-je exporter les données ?',
          a: 'Cette fonctionnalité est en développement. Vous pourrez bientôt exporter les statistiques au format CSV ou PDF.'
        }
      ]
    },
    {
      category: 'Sécurité et Confidentialité',
      questions: [
        {
          q: 'Les données des utilisateurs sont-elles sécurisées ?',
          a: 'Oui. Toutes les données sont stockées de manière sécurisée dans MongoDB. Les mots de passe sont hashés avec bcrypt et les communications utilisent HTTPS.'
        },
        {
          q: 'Puis-je voir les transactions d\'un utilisateur ?',
          a: 'Non, par respect de la confidentialité. Vous pouvez voir les statistiques globales mais pas le détail des transactions individuelles.'
        },
        {
          q: 'Que se passe-t-il quand je bloque un utilisateur ?',
          a: 'L\'utilisateur ne peut plus se connecter mais ses données sont conservées. Il peut être débloqué à tout moment.'
        }
      ]
    },
    {
      category: 'Support Technique',
      questions: [
        {
          q: 'Un utilisateur signale un bug, que faire ?',
          a: 'Notez les détails (email utilisateur, description du bug, étapes de reproduction) et envoyez-les à bugs@mybudget.com.'
        },
        {
          q: 'Comment réinitialiser le mot de passe d\'un utilisateur ?',
          a: 'L\'utilisateur doit utiliser la fonction "Mot de passe oublié" sur la page de connexion. Les administrateurs ne peuvent pas réinitialiser directement les mots de passe.'
        },
        {
          q: 'Le système est lent, que faire ?',
          a: 'Vérifiez la charge serveur et la connexion MongoDB. Si le problème persiste, contactez le support technique à support@mybudget.com.'
        }
      ]
    }
  ];
  
  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
      <AdminHeader />
      
      <div className="flex flex-1">
        <AdminSidebar />
        
        {/* Main Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/admin" className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] text-gray-300 hover:bg-[#383838]' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <MdArrowBack size={24} />
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
                FAQ Administrateur
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
                Questions fréquemment posées et documentation
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {faqs.map((category, catIndex) => (
              <div key={catIndex}>
                <div className="flex items-center gap-2 mb-4">
                  <MdHelp size={24} className="text-[#1E73BE]" />
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {category.category}
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {category.questions.map((item, qIndex) => {
                    const key = `${catIndex}-${qIndex}`;
                    const isOpen = openIndex === key;
                    
                    return (
                      <div
                        key={qIndex}
                        className={`rounded-lg border ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-gray-200'}`}
                      >
                        <button
                          onClick={() => toggleQuestion(catIndex, qIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left"
                        >
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {item.q}
                          </span>
                          {isOpen ? (
                            <MdExpandLess size={24} className="text-[#1E73BE]" />
                          ) : (
                            <MdExpandMore size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          )}
                        </button>
                        {isOpen && (
                          <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className={`mt-8 p-6 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>
              Besoin d'aide supplémentaire ?
            </h3>
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à nous contacter.
            </p>
            <div className="flex gap-4">
              <Link
                to="/admin/support"
                className="bg-[#1E73BE] text-white px-4 py-2 rounded-lg hover:bg-[#155a8a] transition inline-block"
              >
                Contacter le Support
              </Link>
              <a
                href="mailto:support@mybudget.com"
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'border-[#404040] text-gray-300 hover:bg-[#383838]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition`}
              >
                Email
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

