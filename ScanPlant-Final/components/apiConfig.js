// ======================================================================
// CONFIGURAÇÃO DA API - SCANPLANT - MULTI-IP AUTOMÁTICO
// ======================================================================
// Sistema inteligente que tenta múltiplos IPs automaticamente

// Lista de IPs conhecidos (adicione seus IPs aqui)
const KNOWN_IPS = [
  '192.168.0.130',   // Casa
  '192.168.1.100',   // Escola (exemplo - ajuste com o IP real)
  '10.0.0.100',      // Outra rede (exemplo)
  'localhost',       // Fallback para desenvolvimento local
];

const PORT = 5041;
const API_PATH = '/api';

// Variável para armazenar o IP que funciona
let workingBaseUrl = null;

// Função para testar se um IP está acessível
async function testConnection(ip) {
  const baseUrl = ip === 'localhost' 
    ? `http://localhost:${PORT}${API_PATH}`
    : `http://${ip}:${PORT}${API_PATH}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok || response.status === 404) {
      // 404 é OK - significa que o servidor está rodando mas a rota /health não existe
      console.log(`✅ API acessível em: ${baseUrl}`);
      return baseUrl;
    }
  } catch (error) {
    console.log(`❌ Não foi possível conectar em: ${baseUrl}`);
  }
  
  return null;
}

// Função para descobrir o IP que funciona
async function discoverWorkingIP() {
  if (workingBaseUrl) {
    return workingBaseUrl; // Já encontramos antes
  }
  
  console.log('🔍 Procurando API acessível...');
  
  // Testa todos os IPs em paralelo
  const promises = KNOWN_IPS.map(ip => testConnection(ip));
  const results = await Promise.all(promises);
  
  // Pega o primeiro que funcionou
  workingBaseUrl = results.find(url => url !== null);
  
  if (workingBaseUrl) {
    console.log(`✅ API encontrada: ${workingBaseUrl}`);
  } else {
    console.error('❌ Nenhuma API acessível encontrada!');
    // Fallback para o primeiro IP da lista
    workingBaseUrl = `http://${KNOWN_IPS[0]}:${PORT}${API_PATH}`;
    console.log(`⚠️ Usando fallback: ${workingBaseUrl}`);
  }
  
  return workingBaseUrl;
}

export const API_CONFIG = {
  // Esta função retorna o BASE_URL dinâmico
  getBaseUrl: async () => {
    return await discoverWorkingIP();
  },
  
  // BASE_URL síncrono (fallback)
  BASE_URL: `http://${KNOWN_IPS[0]}:${PORT}${API_PATH}`,
  
  TIMEOUT: 10000,
  
  // Adicionar novo IP à lista
  addKnownIP: (ip) => {
    if (!KNOWN_IPS.includes(ip)) {
      KNOWN_IPS.push(ip);
      console.log(`➕ IP adicionado: ${ip}`);
    }
  },
  
  // Forçar re-descoberta (útil se mudar de rede)
  resetConnection: () => {
    workingBaseUrl = null;
    console.log('🔄 Conexão resetada. Próxima requisição vai buscar novamente.');
  }
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
