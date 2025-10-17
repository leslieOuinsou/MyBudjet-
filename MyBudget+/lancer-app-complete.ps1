# Script pour lancer MyBudget+ avec Google OAuth
Write-Host "=== LANCEMENT MYBUDGET+ COMPLET ===" -ForegroundColor Cyan
Write-Host ""

# Démarrer le backend
Write-Host "1. Démarrage du backend avec Google OAuth..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\backend'; npm run start"

# Attendre un peu
Start-Sleep 3

# Démarrer le frontend
Write-Host "2. Démarrage du frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\apps\web'; npm run dev"

Write-Host ""
Write-Host "✅ Les deux services sont en cours de démarrage..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5175" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Google OAuth est activé !" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer ce script..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
