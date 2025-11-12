# Script de Diagnóstico - ScanPlant
# Execute este script para verificar se tudo está configurado corretamente

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO SCANPLANT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$erros = 0
$avisos = 0

# ============================================
# 1. VERIFICAR .NET SDK
# ============================================
Write-Host "1. Verificando .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ .NET SDK instalado: $dotnetVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ .NET SDK não encontrado!" -ForegroundColor Red
        $erros++
    }
} catch {
    Write-Host "   ✗ .NET SDK não encontrado!" -ForegroundColor Red
    $erros++
}

# ============================================
# 2. VERIFICAR NODE.JS
# ============================================
Write-Host "2. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Node.js não encontrado!" -ForegroundColor Red
        $erros++
    }
} catch {
    Write-Host "   ✗ Node.js não encontrado!" -ForegroundColor Red
    $erros++
}

# ============================================
# 3. VERIFICAR POSTGRESQL
# ============================================
Write-Host "3. Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✓ PostgreSQL rodando" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ PostgreSQL instalado mas não está rodando!" -ForegroundColor Yellow
        Write-Host "     Execute: Start-Service $($pgService.Name)" -ForegroundColor Gray
        $avisos++
    }
} else {
    Write-Host "   ✗ PostgreSQL não encontrado ou não está configurado como serviço!" -ForegroundColor Red
    $erros++
}

# ============================================
# 4. VERIFICAR PORTA 5041
# ============================================
Write-Host "4. Verificando porta 5041..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5041 -WarningAction SilentlyContinue
if ($portTest.TcpTestSucceeded) {
    Write-Host "   ✓ Porta 5041 está acessível" -ForegroundColor Green
    
    # Tentar acessar a API
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5041/swagger" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✓ API respondendo em http://localhost:5041/swagger" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Porta 5041 aberta mas API não responde" -ForegroundColor Yellow
        $avisos++
    }
} else {
    Write-Host "   ✗ Porta 5041 não está acessível!" -ForegroundColor Red
    Write-Host "     A API não está rodando. Execute: dotnet run --launch-profile http" -ForegroundColor Gray
    $erros++
}

# ============================================
# 5. VERIFICAR IP LOCAL
# ============================================
Write-Host "5. Verificando IP local..." -ForegroundColor Yellow
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
}

if ($adapters.Count -gt 0) {
    $mainIP = ($adapters | Select-Object -First 1).IPAddress
    Write-Host "   ✓ IP local encontrado: $mainIP" -ForegroundColor Green
    Write-Host "     Use no apiConfig.js: http://$mainIP:5041/api" -ForegroundColor Gray
} else {
    Write-Host "   ⚠ Nenhum IP de rede encontrado!" -ForegroundColor Yellow
    $avisos++
}

# ============================================
# 6. VERIFICAR ARQUIVOS DE CONFIGURAÇÃO
# ============================================
Write-Host "6. Verificando arquivos de configuração..." -ForegroundColor Yellow

# Verificar apiConfig.js
$apiConfigPath = "ScanPlant-Final\components\apiConfig.js"
if (Test-Path $apiConfigPath) {
    Write-Host "   ✓ apiConfig.js encontrado" -ForegroundColor Green
    
    $apiConfig = Get-Content $apiConfigPath -Raw
    if ($apiConfig -match "BASE_URL:\s*'([^']+)'") {
        $configuredUrl = $matches[1]
        Write-Host "     URL configurada: $configuredUrl" -ForegroundColor Gray
        
        if ($configuredUrl -like "*SEU_IP*") {
            Write-Host "   ⚠ URL não foi configurada! Substitua SEU_IP_LOCAL" -ForegroundColor Yellow
            $avisos++
        }
    }
} else {
    Write-Host "   ✗ apiConfig.js não encontrado!" -ForegroundColor Red
    $erros++
}

# Verificar appsettings.json
$appsettingsPath = "ScanPlantAPI\ScanPlantAPI\appsettings.json"
if (Test-Path $appsettingsPath) {
    Write-Host "   ✓ appsettings.json encontrado" -ForegroundColor Green
    
    $appsettings = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
    $connectionString = $appsettings.ConnectionStrings.DefaultConnection
    Write-Host "     Connection String: $connectionString" -ForegroundColor Gray
} else {
    Write-Host "   ✗ appsettings.json não encontrado!" -ForegroundColor Red
    $erros++
}

# ============================================
# 7. VERIFICAR PROCESSOS EM EXECUÇÃO
# ============================================
Write-Host "7. Verificando processos..." -ForegroundColor Yellow

$dotnetProcesses = Get-Process | Where-Object {$_.ProcessName -eq "dotnet"}
if ($dotnetProcesses) {
    Write-Host "   ✓ Processos .NET rodando: $($dotnetProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Nenhum processo .NET rodando" -ForegroundColor Yellow
    Write-Host "     Execute a API: cd ScanPlantAPI\ScanPlantAPI; dotnet run --launch-profile http" -ForegroundColor Gray
    $avisos++
}

$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
if ($nodeProcesses) {
    Write-Host "   ✓ Processos Node.js rodando: $($nodeProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Nenhum processo Node.js rodando" -ForegroundColor Yellow
    Write-Host "     Execute o front-end: cd ScanPlant-Final; npx expo start" -ForegroundColor Gray
    $avisos++
}

# ============================================
# 8. TESTAR CONECTIVIDADE DA API
# ============================================
Write-Host "8. Testando endpoints da API..." -ForegroundColor Yellow
if ($portTest.TcpTestSucceeded) {
    # Testar endpoint de health (se existir) ou swagger
    try {
        $swaggerTest = Invoke-WebRequest -Uri "http://localhost:5041/swagger/index.html" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✓ Swagger acessível" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Swagger não acessível" -ForegroundColor Yellow
        $avisos++
    }
} else {
    Write-Host "   ⊗ Pulado (API não está rodando)" -ForegroundColor Gray
}

# ============================================
# RESUMO
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($erros -eq 0 -and $avisos -eq 0) {
    Write-Host ""
    Write-Host "✓ TUDO OK! Seu ambiente está configurado corretamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar o projeto:" -ForegroundColor White
    Write-Host "1. cd ScanPlantAPI\ScanPlantAPI" -ForegroundColor Gray
    Write-Host "   dotnet run --launch-profile http" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. cd ScanPlant-Final" -ForegroundColor Gray
    Write-Host "   npx expo start" -ForegroundColor Gray
} elseif ($erros -eq 0) {
    Write-Host ""
    Write-Host "⚠ Avisos encontrados: $avisos" -ForegroundColor Yellow
    Write-Host "O projeto pode funcionar, mas revise os avisos acima." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✗ Erros encontrados: $erros" -ForegroundColor Red
    Write-Host "⚠ Avisos encontrados: $avisos" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrija os erros acima antes de continuar." -ForegroundColor Red
}

Write-Host ""
Write-Host "Para mais ajuda, consulte:" -ForegroundColor White
Write-Host "- INICIO_RAPIDO.md" -ForegroundColor Gray
Write-Host "- CHECKLIST_CONEXAO.md" -ForegroundColor Gray
Write-Host "- CONEXAO_FRONT_BACK.md" -ForegroundColor Gray
Write-Host ""

# ============================================
# AÇÕES SUGERIDAS
# ============================================
if ($erros -gt 0 -or $avisos -gt 0) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  AÇÕES SUGERIDAS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($erros -gt 0) {
        Write-Host "Erros críticos:" -ForegroundColor Red
        Write-Host "1. Instale todas as dependências faltantes" -ForegroundColor White
        Write-Host "2. Configure os arquivos de configuração" -ForegroundColor White
        Write-Host "3. Execute novamente este script" -ForegroundColor White
        Write-Host ""
    }
    
    if ($avisos -gt 0) {
        Write-Host "Avisos:" -ForegroundColor Yellow
        Write-Host "1. Inicie os serviços necessários (PostgreSQL, API, Front-end)" -ForegroundColor White
        Write-Host "2. Configure o IP correto no apiConfig.js" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
