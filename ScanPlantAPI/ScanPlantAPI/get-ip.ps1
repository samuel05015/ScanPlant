# Script para descobrir o IP local da sua máquina
# Execute este script no PowerShell para obter o IP que você deve usar no front-end

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESCOBRINDO SEU IP LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter todos os adaptadores de rede ativos
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
}

if ($adapters.Count -eq 0) {
    Write-Host "Nenhum adaptador de rede encontrado!" -ForegroundColor Red
    Write-Host "Verifique se você está conectado à rede." -ForegroundColor Yellow
    exit
}

Write-Host "IPs encontrados na sua máquina:" -ForegroundColor Green
Write-Host ""

foreach ($adapter in $adapters) {
    $interfaceAlias = (Get-NetIPInterface -InterfaceIndex $adapter.InterfaceIndex).InterfaceAlias
    Write-Host "  Interface: $interfaceAlias" -ForegroundColor Yellow
    Write-Host "  IP: $($adapter.IPAddress)" -ForegroundColor White
    Write-Host ""
}

# Tentar identificar o IP principal (Wi-Fi ou Ethernet)
$mainAdapter = $adapters | Where-Object {
    $interface = (Get-NetIPInterface -InterfaceIndex $_.InterfaceIndex).InterfaceAlias
    $interface -like "*Wi-Fi*" -or $interface -like "*Ethernet*" -or $interface -like "*Sem Fio*"
} | Select-Object -First 1

if ($mainAdapter) {
    $mainIP = $mainAdapter.IPAddress
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  IP RECOMENDADO PARA USAR:" -ForegroundColor Green
    Write-Host "  $mainIP" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Configure o arquivo apiConfig.js no front-end com:" -ForegroundColor Yellow
    Write-Host "  BASE_URL: 'http://${mainIP}:5041/api'" -ForegroundColor White
    Write-Host ""
    
    # Copiar para clipboard se possível
    try {
        Set-Clipboard -Value "http://${mainIP}:5041/api"
        Write-Host "✓ URL copiada para a área de transferência!" -ForegroundColor Green
    } catch {
        # Clipboard não disponível
    }
} else {
    Write-Host "Use um dos IPs acima no arquivo apiConfig.js" -ForegroundColor Yellow
    Write-Host "Formato: BASE_URL: 'http://SEU_IP:5041/api'" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
