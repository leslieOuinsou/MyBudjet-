# Script simple de demarrage MyBudget+

Write-Host "Demarrage de MyBudget+..." -ForegroundColor Cyan
Write-Host ""

# Demarrer le backend
$backendPath = "D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\backend"
Write-Host "Demarrage du Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend MyBudget+' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# Demarrer le frontend
$frontendPath = "D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\apps\web"
Write-Host "Demarrage du Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend MyBudget+' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "Application en cours de demarrage !" -ForegroundColor Green
Write-Host ""
Write-Host "URLs :" -ForegroundColor Cyan
Write-Host "  - Frontend : http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend  : http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""

# Attendre et ouvrir le navigateur
Start-Sleep -Seconds 8
Start-Process "http://localhost:5173"

Write-Host "Application demarree !" -ForegroundColor Green

