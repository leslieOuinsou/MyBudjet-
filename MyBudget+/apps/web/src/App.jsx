import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import SignUpPage from "./Pages/SignUpPage.jsx";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage.jsx";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<AdminSignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<GoogleCallbackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/forecasts" element={<ForecastsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/bills" element={<BillRemindersPage />} />
        <Route path="/recurring" element={<RecurringTransactionsPage />} />
        <Route path="/admin" element={<AdministrationPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/billreminders" element={<AdminBillRemindersPage />} />
        <Route path="/admin/recurring" element={<AdminRecurringPage />} />
        <Route path="/admin/support" element={<AdminSupportPage />} />
        <Route path="/admin/faq" element={<AdminFAQPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/contact" element={<SupportPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/importexport" element={<ImportExportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
