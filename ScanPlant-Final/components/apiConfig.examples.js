// ======================================================================
// EXEMPLO DE CONFIGURAÇÃO PARA DIFERENTES CENÁRIOS
// ======================================================================
// Copie e cole a configuração adequada no arquivo apiConfig.js

// ============================================
// CENÁRIO 1: Desenvolvimento Local (Navegador)
// ============================================
// Use quando estiver testando no navegador web ou emulador iOS
export const API_CONFIG_NAVEGADOR = {
  BASE_URL: 'http://localhost:5041/api',
  TIMEOUT: 10000,
};

// ============================================
// CENÁRIO 2: Emulador Android
// ============================================
// Use quando estiver testando no emulador Android (Android Studio)
export const API_CONFIG_ANDROID_EMULATOR = {
  BASE_URL: 'http://10.0.2.2:5041/api',
  TIMEOUT: 10000,
};

// ============================================
// CENÁRIO 3: Dispositivo Físico (Celular/Tablet)
// ============================================
// Use quando estiver testando com Expo Go no celular
// IMPORTANTE: Substitua SEU_IP_LOCAL pelo IP da sua máquina
// Execute o script get-ip.ps1 no back-end para descobrir o IP
export const API_CONFIG_DISPOSITIVO_FISICO = {
  BASE_URL: 'http://192.168.0.100:5041/api',  // Substitua pelo seu IP!
  TIMEOUT: 10000,
};

// ============================================
// CENÁRIO 4: Servidor em Produção
// ============================================
// Use quando sua API estiver hospedada em um servidor
export const API_CONFIG_PRODUCAO = {
  BASE_URL: 'https://api.seudominio.com/api',
  TIMEOUT: 15000,  // Pode aumentar para conexões mais lentas
};

// ============================================
// CENÁRIO 5: API em Outra Porta
// ============================================
// Se você mudou a porta da API no launchSettings.json
export const API_CONFIG_PORTA_CUSTOMIZADA = {
  BASE_URL: 'http://localhost:7000/api',  // Substitua 7000 pela sua porta
  TIMEOUT: 10000,
};

// ============================================
// CENÁRIO 6: Desenvolvimento com Múltiplos IPs
// ============================================
// Útil se você tem Wi-Fi e Ethernet e quer testar ambos
export const API_CONFIG_WIFI = {
  BASE_URL: 'http://192.168.0.100:5041/api',  // IP do Wi-Fi
  TIMEOUT: 10000,
};

export const API_CONFIG_ETHERNET = {
  BASE_URL: 'http://192.168.1.100:5041/api',  // IP do Ethernet
  TIMEOUT: 10000,
};

// ============================================
// COMO USAR:
// ============================================
// 1. Escolha a configuração adequada acima
// 2. Copie o objeto API_CONFIG_XXX
// 3. Cole no arquivo apiConfig.js substituindo o API_CONFIG existente
// 4. Remova o sufixo do nome (ex: API_CONFIG_NAVEGADOR vira API_CONFIG)
//
// Exemplo no apiConfig.js:
// export const API_CONFIG = {
//   BASE_URL: 'http://localhost:5041/api',
//   TIMEOUT: 10000,
// };

// ============================================
// DICAS IMPORTANTES:
// ============================================
// 
// 1. SEMPRE use /api no final da URL
//    ✅ http://localhost:5041/api
//    ❌ http://localhost:5041
//
// 2. NÃO use barra no final
//    ✅ http://localhost:5041/api
//    ❌ http://localhost:5041/api/
//
// 3. Para HTTPS (produção), use certificado válido
//    ✅ https://api.seudominio.com/api
//    ❌ https://localhost:5041/api (não funciona bem com Expo)
//
// 4. Teste a URL no navegador primeiro
//    Acesse: http://SEU_IP:5041/swagger
//    Se não abrir, o app também não conectará
//
// 5. Celular e PC na mesma rede
//    Não funcionará se estiverem em redes diferentes!
//
// ============================================
