# 🌱 ScanPlant - Migração para API C#

## ✅ O que foi feito:

1. ✅ API REST completa em C# criada
2. ✅ Todos os arquivos do app adaptados para usar a nova API
3. ✅ Autenticação JWT automática (não precisa digitar token!)
4. ✅ Banco de dados SQL Server criado
5. ✅ Swagger para testar endpoints

## 🚀 Como usar:

### 1️⃣ A API já está rodando!

- **URL HTTP**: http://localhost:5041
- **URL HTTPS**: https://localhost:7251
- **Swagger**: https://localhost:7251

### 2️⃣ Configurar o App para sua rede:

Edite o arquivo `components/api.js` e ajuste a função `getApiUrl()` se necessário:

```javascript
// Para dispositivo físico, use seu IP local:
return 'http://192.168.0.130:5041/api'; // SEU IP AQUI!
```

Para descobrir seu IP:
```powershell
ipconfig | findstr /i "IPv4"
```

### 3️⃣ Executar o App:

```bash
npm start
```

Ou no Expo:
```bash
npx expo start
```

### 4️⃣ Testar:

1. **Crie uma conta** no app
2. **Faça login** - O token JWT é salvo automaticamente
3. **Adicione plantas** - Funciona automaticamente!
4. **Veja suas plantas** - Tudo sincronizado com a API C#

## 🔐 Como funciona a autenticação:

### Login/Registro:
```javascript
// O app faz login
const { data, error } = await auth.signIn(email, password);

// Se sucesso, recebe:
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  userId: "abc123",
  email: "usuario@teste.com"
}

// O token é SALVO AUTOMATICAMENTE no AsyncStorage
```

### Requisições seguintes:
```javascript
// Quando você adiciona uma planta:
const result = await database.insert('plants', plantData);

// O api.js FAZ AUTOMATICAMENTE:
// 1. Busca o token salvo
// 2. Adiciona header: Authorization: Bearer TOKEN
// 3. Envia para a API C#
// 4. API valida o token
// 5. Retorna os dados
```

### Logout:
```javascript
await auth.signOut();
// Remove o token do storage
```

## 📋 Arquivos modificados:

Todos os arquivos abaixo agora usam `import { ... } from './api'`:

- ✅ LoginScreen.js
- ✅ CriarConta.js
- ✅ PlantGallery.js
- ✅ PlantDetailScreen.js
- ✅ ProfileSettingsScreen.js
- ✅ PhotoScreen.js
- ✅ TransferPlants.js
- ✅ ChatScreen.js
- ✅ ChatListScreen.js
- ✅ UserListScreen.js
- ✅ DebugAuthScreen.js

## 🔧 Arquivos novos criados:

- ✅ `components/api.js` - Wrapper da API C# (substitui supabase.js)
- ✅ `components/apiConfig.js` - Configurações de URL
- ✅ API completa em `C:\Users\sh050\OneDrive\Documentos\ScanPlantAPI\`

## 📱 Diferenças importantes:

### ANTES (Supabase):
```javascript
const { data, error } = await supabase
  .from('plants')
  .select('*')
  .eq('user_id', userId);
```

### AGORA (API C#):
```javascript
// MESMA SINTAXE! O api.js converte automaticamente
const { data, error } = await supabase
  .from('plants')
  .select('*')
  .eq('user_id', userId);
```

## 🎯 Endpoints da API:

### Autenticação:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/profile

### Plantas:
- POST /api/plants
- GET /api/plants (todas)
- GET /api/plants/my (minhas)
- GET /api/plants/{id}
- PUT /api/plants/{id}
- DELETE /api/plants/{id}

### Chats:
- POST /api/chats
- GET /api/chats
- GET /api/chats/{id}

### Mensagens:
- POST /api/messages
- GET /api/messages/chat/{chatId}

## ⚠️ Troubleshooting:

### "Network request failed":
- Verifique se a API está rodando (veja processo 17928)
- Verifique o IP no arquivo `api.js`
- Para Android, adicione `android:usesCleartextTraffic="true"` no AndroidManifest.xml

### "401 Unauthorized":
- O token expirou, faça login novamente
- O token expira em 7 dias

### "Cannot connect to API":
- Verifique se está na mesma rede WiFi (dispositivo físico)
- Use `http://10.0.2.2:5041/api` para emulador Android
- Use `http://localhost:5041/api` para emulador iOS

## 🎉 Está pronto!

Agora você pode:
- ✅ Adicionar plantas pelo app → Salva na API C#
- ✅ Ver plantas → Busca da API C#
- ✅ Editar/Deletar → Atualiza na API C#
- ✅ Chat → Funciona com a API C#
- ✅ Perfil → Sincroniza com a API C#

**Sem precisar digitar token manualmente! Tudo automático! 🚀**
