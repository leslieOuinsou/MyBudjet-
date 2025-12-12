import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen.jsx";
import HomePage from "./Pages/HomePage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import SignUpPage from "./Pages/SignUpPage.jsx";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./Pages/ResetPasswordPage.jsx";
import DashboardPage from "./Pages/DashboardPage.jsx";
import CategoriesPage from "./Pages/CategoriesPage.jsx";
import SettingsPage from "./Pages/SettingsPage.jsx";
import ForecastsPage from "./Pages/ForecastsPage.jsx";
import UserProfilePage from "./Pages/UserProfilePage.jsx";
import NotificationsPage from "./Pages/NotificationsPage.jsx";
import BillRemindersPage from "./Pages/BillRemindersPage.jsx";
import RecurringTransactionsPage from "./Pages/RecurringTransactionsPage.jsx";
import AdministrationPage from "./Pages/AdministrationPage.jsx";
import AdminUsersPage from "./Pages/AdminUsersPage.jsx";
import AdminBillRemindersPage from "./Pages/AdminBillRemindersPage.jsx";
import AdminRecurringPage from "./Pages/AdminRecurringPage.jsx";
import AdminSupportPage from "./Pages/AdminSupportPage.jsx";
import AdminFAQPage from "./Pages/AdminFAQPage.jsx";
import AdminProfilePage from "./Pages/AdminProfilePage.jsx";
import AdminSettingsPage from "./Pages/AdminSettingsPage.jsx";
import AdminLoginPage from "./Pages/AdminLoginPage.jsx";
import AdminSignUpPage from "./Pages/AdminSignUpPage.jsx";
import SupportPage from "./Pages/SupportPage.jsx";
import FAQPage from "./Pages/FAQPage.jsx";
import NotFoundPage from "./Pages/NotFoundPage.jsx";
import ServerErrorPage from "./Pages/ServerErrorPage.jsx";
import AccessDeniedPage from "./Pages/AccessDeniedPage.jsx";
import BudgetsPage from "./Pages/BudgetsPage.jsx";
import ExpensesPage from "./Pages/ExpensesPage.jsx";
import TransactionsPage from "./Pages/TransactionsPage.jsx";
import ReportsPage from "./Pages/ReportsPage.jsx";
import ImportExportPage from "./Pages/ImportExportPage.jsx";
import GoogleCallbackPage from "./Pages/GoogleCallbackPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PrivacyPolicyPage from "./Pages/PrivacyPolicyPage.jsx";
import CookieConsent from "./components/CookieConsent.jsx";

// Composant pour gérer la logique de chargement initial
function AppContent() {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Vérifier si c'est la première visite
    const hasVisited = sessionStorage.getItem('hasVisited');
    
    if (hasVisited) {
      // Si l'utilisateur a déjà visité, ne pas montrer le loading
      setShowLoading(false);
    } else {
      // Sinon, montrer le loading pendant 3 secondes
      const timer = setTimeout(() => {
        sessionStorage.setItem('hasVisited', 'true');
        setShowLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/signup" element={<AdminSignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />
      
      {/* Routes protégées utilisateur */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/forecasts" element={<ProtectedRoute><ForecastsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute><BillRemindersPage /></ProtectedRoute>} />
      <Route path="/recurring" element={<ProtectedRoute><RecurringTransactionsPage /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/importexport" element={<ProtectedRoute><ImportExportPage /></ProtectedRoute>} />
      
      {/* Routes protégées admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdministrationPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
      <Route path="/admin/billreminders" element={<ProtectedRoute adminOnly><AdminBillRemindersPage /></ProtectedRoute>} />
      <Route path="/admin/recurring" element={<ProtectedRoute adminOnly><AdminRecurringPage /></ProtectedRoute>} />
      <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupportPage /></ProtectedRoute>} />
      <Route path="/admin/faq" element={<ProtectedRoute adminOnly><AdminFAQPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute adminOnly><AdminProfilePage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettingsPage /></ProtectedRoute>} />
      <Route path="/contact" element={<SupportPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      
      {/* Bannière de consentement des cookies RGPD */}
      <CookieConsent />
    </BrowserRouter>
  );
}
