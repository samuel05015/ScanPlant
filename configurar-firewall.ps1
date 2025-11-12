# Execute este script como ADMINISTRADOR
# Botão direito > Executar com PowerShell

Write-Host "Criando regra de firewall para ScanPlant API..." -ForegroundColor Cyan

try {
    # Criar regra de entrada para porta 5041
    New-NetFirewallRule `
        -DisplayName "ScanPlant API - Porta 5041" `
        -Direction Inbound `
        -LocalPort 5041 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Domain `
        -ErrorAction Stop
    
    Write-Host "✓ Regra de firewall criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "A porta 5041 agora está aberta para conexões na rede local." -ForegroundColor White
    
} catch {
    Write-Host "✗ Erro ao criar regra: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente manualmente:" -ForegroundColor Yellow
    Write-Host "1. Abra 'Firewall do Windows com Segurança Avançada'" -ForegroundColor White
    Write-Host "2. Clique em 'Regras de Entrada' > 'Nova Regra'" -ForegroundColor White
    Write-Host "3. Tipo: Porta > TCP > Porta 5041" -ForegroundColor White
    Write-Host "4. Permitir conexão" -ForegroundColor White
    Write-Host "5. Aplicar a: Domínio, Privado" -ForegroundColor White
    Write-Host "6. Nome: ScanPlant API" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
