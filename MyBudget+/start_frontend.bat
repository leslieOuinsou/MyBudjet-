@echo off
echo 🌐 Demarrage du frontend MyBudget+
echo ===================================

cd /d "%~dp0apps\web"

echo 📦 Installation des dependances...
call npm install

echo 🌐 Demarrage du serveur de developpement...
echo Le frontend sera accessible sur http://localhost:5173
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

call npm run dev

pause
