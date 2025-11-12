# 🌐 Sistema Multi-IP Automático - IMPLEMENTADO

## ✅ O que foi feito

Agora o ScanPlant **detecta automaticamente qual IP está funcionando**!

### Como funciona:
1. O app tenta conectar em todos os IPs conhecidos simultaneamente
2. Usa o primeiro que responder
3. Memoriza para as próximas requisições
4. **Funciona em qualquer rede sem precisar reconfigurar!**

## 📋 Como adicionar o IP da escola

### Método 1: No código (antes de ir para escola)

1. Abra: `ScanPlant-Final/components/apiConfig.js`
2. Na linha 7, adicione o IP da escola:

```javascript
const KNOWN_IPS = [
  '192.168.0.130',   // Casa
  '192.168.1.50',    // Escola - ADICIONE O IP AQUI
  '10.0.0.100',      // Outra rede
  'localhost',
];
```

### Método 2: Descobrir IP na escola

No PowerShell da escola:
```powershell
ipconfig
```

Procure por "Endereço IPv4" - exemplo: `192.168.1.50`

## 🎯 Vantagens

✅ **Funciona em casa**  
✅ **Funciona na escola**  
✅ **Funciona em qualquer rede**  
✅ **Sem precisar reconfigurar**  
✅ **Detecta automaticamente**  

## 🔄 Se mudar de rede

O app automaticamente re-testa as conexões na primeira requisição após trocar de rede.

## 📱 Logs no console

Você verá no console do Expo:
```
🔍 Procurando API acessível...
❌ Não foi possível conectar em: http://192.168.0.130:5041/api
✅ API acessível em: http://192.168.1.50:5041/api
✅ API encontrada: http://192.168.1.50:5041/api
```

## ⚡ Teste agora

1. Adicione o IP da escola no array `KNOWN_IPS`
2. O app vai testar todos automaticamente
3. Funciona! 🎉

## 🛠️ Comandos úteis na escola

```powershell
# Ver seu IP
ipconfig

# Testar se API está rodando
Test-NetConnection -ComputerName localhost -Port 5041

# Configurar firewall (se necessário)
.\configurar-firewall.ps1
```

## ⚠️ Importante

- Certifique-se de que o backend está rodando (Visual Studio)
- Celular e PC devem estar no mesmo WiFi
- A porta 5041 deve estar liberada no firewall
