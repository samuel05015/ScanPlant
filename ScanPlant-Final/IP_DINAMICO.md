# 🌐 SOLUÇÃO: IP DINÂMICO AUTOMÁTICO

## Problema
Na escola, o app fica em loading infinito porque o IP configurado (`192.168.0.130`) é diferente do IP da rede da escola.

## Soluções

### ✅ Opção 1: Descobrir IP na Escola (Rápido)
1. No computador da escola, abra PowerShell
2. Execute:
   ```powershell
   ipconfig
   ```
3. Procure por "Adaptador de Rede sem Fio" ou "Ethernet"
4. Copie o "Endereço IPv4" (ex: `192.168.1.50`)
5. No arquivo `apiConfig.js`, altere a linha:
   ```javascript
   BASE_URL: 'http://192.168.1.50:5041/api',  // Use o IP da escola
   ```

### ✅ Opção 2: Sistema Multi-IP (Melhor)
Configure múltiplos IPs e o app tentará todos automaticamente:

```javascript
// Em apiConfig.js
export const API_CONFIG = {
  IPS_CONHECIDOS: [
    'http://192.168.0.130:5041/api',  // Casa
    'http://192.168.1.50:5041/api',   // Escola (descubra o IP correto)
    'http://10.0.0.100:5041/api',     // Outra rede
  ],
  TIMEOUT: 5000
};
```

### ⚠️ Verificações Importantes na Escola

**1. WiFi - Celular e PC na mesma rede?**
- Verifique se ambos estão conectados ao mesmo WiFi
- Escolas às vezes têm rede de alunos e rede de professores separadas

**2. Firewall da Escola**
- Algumas escolas bloqueiam portas personalizadas
- Teste se a porta 5041 está acessível

**3. Teste de Conectividade**
No PowerShell da escola:
```powershell
# Ver seu IP
ipconfig

# Testar se a API está rodando
Test-NetConnection -ComputerName localhost -Port 5041

# Testar do IP da rede
Test-NetConnection -ComputerName 192.168.X.X -Port 5041
```

## 🚀 Solução Definitiva: QR Code com IP Automático

Quando você inicia o Expo, ele gera um QR Code. O IP está nesse QR Code!

**No computador da escola:**
1. Inicie o backend (Visual Studio)
2. Inicie o Expo: `npx expo start`
3. O Expo mostrará o IP atual (ex: `exp://192.168.1.50:8081`)
4. Use esse IP base no `apiConfig.js`

## Resumo do Processo

### Em Casa:
```javascript
BASE_URL: 'http://192.168.0.130:5041/api'
```

### Na Escola:
1. Descubra o IP: `ipconfig` no PowerShell
2. Altere para: `BASE_URL: 'http://IP_DA_ESCOLA:5041/api'`
3. Reinicie o Expo

## Dica Pro: Deixar Preparado
Antes de ir para a escola:
1. Mantenha o `get-ip.ps1` acessível
2. Tenha o `apiConfig.js` fácil de editar
3. Ou use a Opção 2 (Multi-IP) para evitar mudanças
