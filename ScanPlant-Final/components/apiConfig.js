// ======================================================================
// CONFIGURAÇÃO DA API - SCANPLANT
// ======================================================================
// Este arquivo centraliza a configuração da URL da API para diferentes ambientes

// INSTRUÇÕES:
// 1. Execute o script get-ip.ps1 no backend para descobrir seu IP local
// 2. Descomente e configure a linha correspondente ao seu ambiente
// 3. A porta padrão da API é 5041

export const API_CONFIG = {
  // ============================================
  // ESCOLHA UMA DAS OPÇÕES ABAIXO:
  // ============================================
  
  // OPÇÃO 1: EMULADOR ANDROID
  // Use este IP especial que o Android redireciona para localhost do PC
  // BASE_URL: 'http://10.0.2.2:5041/api',
  
  // OPÇÃO 2: EMULADOR iOS ou NAVEGADOR WEB
  // Funciona quando o front-end está rodando no mesmo computador que a API
  // BASE_URL: 'http://localhost:5041/api',
  
  // OPÇÃO 3: DISPOSITIVO FÍSICO (Celular/Tablet) ou EXPO GO
  // Substitua 'SEU_IP_LOCAL' pelo IP da sua máquina na rede
  // Execute o script get-ip.ps1 no backend para descobrir seu IP
  // Exemplo: 'http://192.168.0.100:5041/api'
  BASE_URL: 'http://192.168.0.130:5041/api',
  
  // ============================================
  // CONFIGURAÇÕES ADICIONAIS
  // ============================================
  TIMEOUT: 10000, // Timeout de 10 segundos para requisições
};

// ======================================================================
// COMO DESCOBRIR SEU IP LOCAL:
// ======================================================================
// 
// WINDOWS:
//   1. Abra o PowerShell no diretório do backend
//   2. Execute: .\get-ip.ps1
//   3. O script mostrará seu IP e copiará a URL completa
//
// MANUAL (Windows):
//   1. Abra PowerShell ou CMD
//   2. Execute: ipconfig
//   3. Procure por "Endereço IPv4" na seção Wi-Fi ou Ethernet
//   4. Use esse IP no formato: http://SEU_IP:5041/api
//
// MANUAL (Mac/Linux):
//   1. Abra o Terminal
//   2. Execute: ifconfig | grep "inet "
//   3. Procure pelo IP que não seja 127.0.0.1
//   4. Use esse IP no formato: http://SEU_IP:5041/api
//
// ======================================================================
// IMPORTANTE:
// ======================================================================
// - Certifique-se de que seu celular e PC estão na MESMA REDE Wi-Fi
// - Desative firewalls que possam bloquear a porta 5041
// - A API deve estar rodando antes de testar o app
// ======================================================================
