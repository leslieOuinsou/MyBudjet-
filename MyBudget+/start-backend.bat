@echo off
title MyBudget+ Backend Server

echo.
echo ========================================
echo    MyBudget+ Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/4] Verification des dependances...
if not exist "node_modules" (
    echo [!] Installation des dependances necessaires...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances
        pause
        exit /b 1
    )
)

echo [2/4] Verification de MongoDB...
echo [INFO] Assurez-vous que MongoDB est demarré
echo.

echo [3/4] Verification du port 3001...
netstat -an | find "3001" >nul
if not errorlevel 1 (
    echo [!] Le port 3001 est deja occupe
    echo [!] Le serveur va essayer de demarrer quand meme...
    echo.
)

echo [4/4] Demarrage du serveur backend...
echo.
echo Le serveur sera accessible sur: http://localhost:3001
echo Routes reports disponibles sur: http://localhost:3001/api/reports/
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo ========================================
echo.

call npm start

if errorlevel 1 (
    echo.
    echo [ERREUR] Echec du demarrage du serveur
    echo.
    echo Causes possibles:
    echo - MongoDB n'est pas demarré
    echo - Port 3001 occupe
    echo - Erreur dans le code backend
    echo.
    pause
)

echo.
echo Serveur arrete.
pause
