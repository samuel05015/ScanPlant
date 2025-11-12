# 🚀 Guia Rápido - ScanPlant

## ⚡ Início Rápido (3 passos)

### 1. Inicie o Back-end
```powershell
cd "ScanPlantAPI\ScanPlantAPI"
dotnet run --launch-profile http
```
✅ Abra http://localhost:5041/swagger para confirmar

### 2. Configure o Front-end
Edite: `ScanPlant-Final\components\apiConfig.js`

**Se for usar no CELULAR:**
1. Execute: `.\get-ip.ps1` (no diretório do back-end)
2. Use o IP mostrado no `apiConfig.js`
3. Exemplo: `BASE_URL: 'http://192.168.0.100:5041/api'`

**Se for usar no NAVEGADOR:**
- Deixe: `BASE_URL: 'http://localhost:5041/api'`

### 3. Inicie o Front-end
```powershell
cd "ScanPlant-Final"
npm install          # Só na primeira vez
npx expo start
```
📱 Escaneie o QR code com Expo Go ou pressione `w` para web

---

## 🔧 Pré-requisitos Checklist

- [ ] PostgreSQL rodando (porta 5432)
- [ ] Banco `ScanPlantDB` criado
- [ ] .NET 8 SDK instalado
- [ ] Node.js 18+ instalado
- [ ] Expo Go no celular (se for testar no celular)

---

## 🐛 Problema Comum #1: "Network request failed"

**Solução:**
1. ✅ API está rodando? Teste: http://localhost:5041/swagger
2. ✅ Celular e PC na mesma rede Wi-Fi?
3. ✅ IP correto no `apiConfig.js`?
4. ✅ Firewall bloqueando? Desative temporariamente

---

## 🐛 Problema Comum #2: Erro no banco de dados

**Solução:**
1. PostgreSQL rodando?
   ```powershell
   Get-Service -Name postgresql*
   ```
2. Credenciais corretas em `appsettings.json`?
   - Host: localhost
   - Port: 5432
   - Database: ScanPlantDB
   - Username: postgres
   - Password: 123456

---

## 📍 Onde Configurar a URL

**Arquivo principal:** `ScanPlant-Final\components\apiConfig.js`

Descomente a linha adequada:
```javascript
// CELULAR (Expo Go):
BASE_URL: 'http://SEU_IP:5041/api',

// NAVEGADOR/EMULADOR iOS:
BASE_URL: 'http://localhost:5041/api',

// EMULADOR ANDROID:
BASE_URL: 'http://10.0.2.2:5041/api',
```

---

## 🎯 Testando a Conexão

1. **Backend Funcionando?**
   - Abra: http://localhost:5041/swagger
   - Deve mostrar a documentação da API

2. **Frontend Conectando?**
   - Abra o app
   - Vá em "Criar Conta"
   - Preencha e clique em cadastrar
   - Se funcionar = conexão OK! 🎉

3. **Veja os Logs**
   - Backend: Console do PowerShell onde rodou `dotnet run`
   - Frontend: Console do Expo

---

## 📚 Documentação Completa

Para mais detalhes, veja: `CONEXAO_FRONT_BACK.md`

---

## 💡 Dicas

- 🔄 Sempre inicie o **back-end ANTES** do front-end
- 🌐 Use o script `get-ip.ps1` para descobrir seu IP facilmente
- 🔥 Desabilite firewall temporariamente se tiver problemas
- 📱 Certifique-se que celular e PC estão na **mesma rede**
- 🧹 Limpe o cache do Expo se algo estranho: `npx expo start -c`

---

Pronto para começar! 🚀
