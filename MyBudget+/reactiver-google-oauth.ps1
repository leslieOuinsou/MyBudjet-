# Script pour réactiver Google OAuth
Write-Host "=== RÉACTIVATION GOOGLE OAUTH ===" -ForegroundColor Cyan
Write-Host ""

# Arrêter le backend
Write-Host "1. Arrêt du backend..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}
Start-Sleep 2

# Réactiver les variables d'environnement
Write-Host "2. Réactivation des variables d'environnement..." -ForegroundColor Yellow
$envFile = "D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\backend\.env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $newContent = $content -replace '^# GOOGLE_', 'GOOGLE_'
    Set-Content $envFile $newContent
    Write-Host "✅ Variables d'environnement réactivées" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier .env non trouvé" -ForegroundColor Red
}

# Réactiver les routes
Write-Host "3. Réactivation des routes Google OAuth..." -ForegroundColor Yellow
$routesFile = "D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\backend\src\routes\auth.js"
if (Test-Path $routesFile) {
    $content = Get-Content $routesFile
    $newContent = $content -replace '^// router\.get\(`'/google`', 'router.get(`'/google`'
    $newContent = $newContent -replace '^// router\.get\(`'/google/callback`', 'router.get(`'/google/callback`'
    Set-Content $routesFile $newContent
    Write-Host "✅ Routes Google OAuth réactivées" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier auth.js non trouvé" -ForegroundColor Red
}

# Redémarrer le backend
Write-Host "4. Redémarrage du backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Mes Projets Perso\Gestionnaire de finances personnelles\MyBudget+\backend'; npm run start"

Write-Host ""
Write-Host "✅ Google OAuth réactivé !" -ForegroundColor Green
Write-Host "Backend en cours de redémarrage..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Pour tester Google OAuth :" -ForegroundColor Cyan
Write-Host "1. Allez sur http://localhost:5174" -ForegroundColor White
Write-Host "2. Cliquez sur 'Se connecter avec Google'" -ForegroundColor White
Write-Host "3. Connectez-vous avec votre compte Google" -ForegroundColor White
