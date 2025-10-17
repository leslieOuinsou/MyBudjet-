# Script pour arrêter MyBudget+

Write-Host "🛑 Arrêt de MyBudget+..." -ForegroundColor Yellow
Write-Host ""

# Arrêter les processus Node.js sur les ports 3001 et 5173
Write-Host "📊 Recherche des processus..." -ForegroundColor Cyan

# Port 3001 (Backend)
$backend = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backend) {
    $backendPID = $backend.OwningProcess
    Write-Host "🔧 Arrêt du Backend (PID: $backendPID)..." -ForegroundColor Yellow
    Stop-Process -Id $backendPID -Force
    Write-Host "✅ Backend arrêté" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aucun processus backend trouvé sur le port 3001" -ForegroundColor Gray
}

# Port 5173 (Frontend)
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend) {
    $frontendPID = $frontend.OwningProcess
    Write-Host "🌐 Arrêt du Frontend (PID: $frontendPID)..." -ForegroundColor Yellow
    Stop-Process -Id $frontendPID -Force
    Write-Host "✅ Frontend arrêté" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aucun processus frontend trouvé sur le port 5173" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ MyBudget+ arrêté" -ForegroundColor Green
Write-Host ""

