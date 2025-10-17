@echo off
echo 🚀 Demarrage du serveur backend MyBudget+
echo ============================================

cd /d "%~dp0backend"

echo 📦 Installation des dependances...
call npm install

echo 📦 Installation de pdfkit...
call npm install pdfkit

echo 🚀 Demarrage du serveur...
echo Le serveur sera accessible sur http://localhost:5000
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

call npm start

pause
