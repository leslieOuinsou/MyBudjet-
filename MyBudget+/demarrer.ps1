# Script de démarrage rapide pour MyBudget+
# Exécutez ce script pour démarrer l'application complète

Write-Host "🚀 Démarrage de MyBudget+..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si MongoDB est accessible
Write-Host "📊 Vérification de MongoDB..." -ForegroundColor Yellow
try {
    $mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "✅ MongoDB est déjà démarré" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB n'est pas détecté" -ForegroundColor Yellow
        Write-Host "   Option 1: Démarrez MongoDB manuellement avec 'mongod'" -ForegroundColor Gray
        Write-Host "   Option 2: Utilisez Docker avec 'docker-compose up -d mongo'" -ForegroundColor Gray
        $continue = Read-Host "Continuer quand même ? (O/N)"
        if ($continue -ne "O" -and $continue -ne "o") {
            exit
        }
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier MongoDB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Démarrage du Backend..." -ForegroundColor Yellow

# Démarrer le backend dans un nouveau terminal
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend MyBudget+' -ForegroundColor Cyan; npm run dev"

Write-Host "✅ Backend démarré dans un nouveau terminal" -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🌐 Démarrage du Frontend..." -ForegroundColor Yellow

# Démarrer le frontend dans un nouveau terminal
$frontendPath = Join-Path $PSScriptRoot "apps\web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🌐 Frontend MyBudget+' -ForegroundColor Cyan; npm run dev"

Write-Host "✅ Frontend démarré dans un nouveau terminal" -ForegroundColor Green

Write-Host ""
Write-Host "✨ MyBudget+ est en cours de démarrage !" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Dans quelques secondes :" -ForegroundColor Cyan
Write-Host "   - Backend API : http://localhost:3001/api/health" -ForegroundColor White
Write-Host "   - Frontend    : http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Astuce : Gardez cette fenêtre ouverte pour surveiller le démarrage" -ForegroundColor Yellow
Write-Host ""

# Attendre quelques secondes puis ouvrir le navigateur
Write-Host "⏳ Ouverture du navigateur dans 8 secondes..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Ouvrir le navigateur
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "🎉 Application démarrée !" -ForegroundColor Green
Write-Host "   Fermez les fenêtres backend et frontend pour arrêter l'application" -ForegroundColor Gray
Write-Host ""

