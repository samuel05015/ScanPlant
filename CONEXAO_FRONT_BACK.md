# 🌱 ScanPlant - Guia de Instalação e Execução

Este guia explica como conectar e executar o front-end (React Native/Expo) e o back-end (C# .NET 8) do ScanPlant.

---

## 📋 Pré-requisitos

### Back-end (API C#)
- ✅ .NET 8 SDK ([Download](https://dotnet.microsoft.com/download/dotnet/8.0))
- ✅ PostgreSQL instalado e rodando ([Download](https://www.postgresql.org/download/))
- ✅ Visual Studio 2022, VS Code ou Rider (opcional)

### Front-end (React Native)
- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ Expo CLI: `npm install -g expo-cli`
- ✅ Expo Go app no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))

---

## 🔧 Configuração - Passo a Passo

### 1️⃣ Configurar o Banco de Dados PostgreSQL

1. **Instale o PostgreSQL** se ainda não tiver
2. **Crie um usuário e banco de dados**:

```sql
-- Conecte-se ao PostgreSQL como superusuário (postgres)
CREATE USER postgres WITH PASSWORD '123456';
CREATE DATABASE ScanPlantDB OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE ScanPlantDB TO postgres;
```

3. **Verifique as credenciais** no arquivo:
   ```
   ScanPlantAPI/ScanPlantAPI/appsettings.json
   ```

   A configuração padrão é:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=ScanPlantDB;Username=postgres;Password=123456"
   }
   ```

   ⚠️ **Se suas credenciais forem diferentes**, edite este arquivo!

---

### 2️⃣ Executar o Back-end (API C#)

1. **Abra o PowerShell** no diretório:
   ```
   ScanPlantAPI\ScanPlantAPI\
   ```

2. **Restaure os pacotes**:
   ```powershell
   dotnet restore
   ```

3. **Execute a API**:
   ```powershell
   dotnet run --launch-profile http
   ```

   A API estará disponível em:
   - 🌐 **Swagger UI**: http://localhost:5041/swagger
   - 📡 **API Base**: http://localhost:5041/api

4. **Verifique se está funcionando**:
   - Abra o navegador em: http://localhost:5041/swagger
   - Você deve ver a documentação da API

---

### 3️⃣ Descobrir seu IP Local (para dispositivos físicos)

Se você vai testar no celular com Expo Go, precisa do IP da sua máquina:

1. **Execute o script** no diretório do back-end:
   ```powershell
   .\get-ip.ps1
   ```

   O script mostrará seu IP e copiará a URL para a área de transferência.

2. **OU descubra manualmente**:
   ```powershell
   ipconfig
   ```
   Procure por **"Endereço IPv4"** na seção Wi-Fi ou Ethernet.
   Exemplo: `192.168.0.100`

---

### 4️⃣ Configurar o Front-end

1. **Abra o arquivo**:
   ```
   ScanPlant-Final\components\apiConfig.js
   ```

2. **Escolha a configuração** adequada:

   **Para Emulador Android:**
   ```javascript
   BASE_URL: 'http://10.0.2.2:5041/api',
   ```

   **Para Navegador Web ou Emulador iOS:**
   ```javascript
   BASE_URL: 'http://localhost:5041/api',
   ```

   **Para Dispositivo Físico (Celular com Expo Go):**
   ```javascript
   BASE_URL: 'http://SEU_IP_LOCAL:5041/api',  // Ex: http://192.168.0.100:5041/api
   ```

3. **Salve o arquivo**.

---

### 5️⃣ Executar o Front-end

1. **Abra o PowerShell** no diretório:
   ```
   ScanPlant-Final\
   ```

2. **Instale as dependências** (primeira vez):
   ```powershell
   npm install
   ```

3. **Inicie o Expo**:
   ```powershell
   npx expo start
   ```

4. **Abra o app**:
   - **No celular**: Escaneie o QR code com o app Expo Go
   - **No navegador**: Pressione `w`
   - **No emulador Android**: Pressione `a`
   - **No emulador iOS**: Pressione `i`

---

## 🔍 Testando a Conexão

### Teste 1: API está respondendo?
```powershell
curl http://localhost:5041/swagger
```

### Teste 2: Criar uma conta no app
1. Abra o app no celular
2. Vá para "Criar Conta"
3. Preencha os dados e clique em "Cadastrar"
4. Se funcionar, a conexão está OK! 🎉

### Teste 3: Verificar logs
- **Back-end**: Veja o console do PowerShell onde executou `dotnet run`
- **Front-end**: Veja o console do Expo (onde executou `npx expo start`)

---

## 🚨 Solução de Problemas

### ❌ Erro: "Network request failed"

**Causa**: O front-end não consegue acessar a API.

**Soluções**:
1. ✅ Verifique se a API está rodando (http://localhost:5041/swagger)
2. ✅ Confirme se o IP em `apiConfig.js` está correto
3. ✅ Seu celular e PC estão na **mesma rede Wi-Fi**?
4. ✅ Desative temporariamente o firewall do Windows
5. ✅ Reinicie a API com `dotnet run --launch-profile http`

### ❌ Erro no banco de dados

**Causa**: Credenciais incorretas ou PostgreSQL não está rodando.

**Soluções**:
1. ✅ Verifique se o PostgreSQL está rodando:
   ```powershell
   Get-Service -Name postgresql*
   ```
2. ✅ Confirme as credenciais em `appsettings.json`
3. ✅ Teste a conexão manualmente com pgAdmin ou DBeaver

### ❌ Erro: "Connection refused" na porta 5041

**Causa**: Outra aplicação está usando a porta 5041.

**Solução**:
```powershell
# Ver o que está usando a porta
netstat -ano | findstr :5041

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### ❌ App fica em "Loading..." infinito

**Causa**: Configuração incorreta da URL da API.

**Soluções**:
1. ✅ Verifique o console do Expo para ver a URL sendo usada
2. ✅ Confirme que o IP em `apiConfig.js` está correto
3. ✅ Force reload: Shake o celular e clique em "Reload"

---

## 📱 Ambientes de Teste

| Ambiente | URL da API | Observações |
|----------|-----------|-------------|
| 🖥️ Navegador Web | `http://localhost:5041/api` | Funciona direto |
| 📱 Emulador Android | `http://10.0.2.2:5041/api` | IP especial do Android |
| 🍎 Emulador iOS | `http://localhost:5041/api` | Funciona direto |
| 📱 Celular (Expo Go) | `http://SEU_IP:5041/api` | Precisa do IP da rede |

---

## 🔐 Credenciais Padrão

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: ScanPlantDB
- **Username**: postgres
- **Password**: 123456

### JWT (Configurado automaticamente)
- **Key**: Definida em `appsettings.json`
- **Issuer**: ScanPlantAPI
- **Audience**: ScanPlantApp

---

## 📦 Scripts Úteis

### Back-end (no diretório `ScanPlantAPI\ScanPlantAPI\`)

```powershell
# Executar a API
dotnet run --launch-profile http

# Executar com watch (auto-reload)
dotnet watch run --launch-profile http

# Criar migration
dotnet ef migrations add NomeDaMigration

# Aplicar migrations
dotnet ef database update

# Descobrir IP local
.\get-ip.ps1
```

### Front-end (no diretório `ScanPlant-Final\`)

```powershell
# Instalar dependências
npm install

# Iniciar Expo
npx expo start

# Limpar cache e reiniciar
npx expo start -c

# Atualizar dependências
npm update
```

---

## 📚 Estrutura do Projeto

```
ScanPlant/
├── ScanPlantAPI/              # Back-end C# .NET 8
│   ├── Controllers/           # Endpoints da API
│   ├── Models/               # Modelos de dados
│   ├── Services/             # Lógica de negócio
│   ├── Data/                 # Contexto do banco
│   ├── DTOs/                 # Data Transfer Objects
│   ├── appsettings.json      # Configurações (DB, JWT)
│   ├── Program.cs            # Configuração da API
│   └── get-ip.ps1           # Script para descobrir IP
│
└── ScanPlant-Final/          # Front-end React Native
    ├── components/           # Componentes e telas
    │   ├── api.js           # Cliente da API
    │   ├── apiConfig.js     # Configuração da URL ⚠️
    │   └── ...
    ├── App.js               # Ponto de entrada
    └── package.json         # Dependências
```

---

## ✅ Checklist de Execução

### Primeira execução:

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `ScanPlantDB` criado
- [ ] Credenciais conferidas em `appsettings.json`
- [ ] .NET 8 SDK instalado
- [ ] Node.js e Expo CLI instalados
- [ ] IP local descoberto (se for usar celular)
- [ ] URL configurada em `apiConfig.js`
- [ ] Back-end rodando (`dotnet run`)
- [ ] Front-end rodando (`npx expo start`)
- [ ] Celular e PC na mesma rede Wi-Fi

### Execuções seguintes:

- [ ] Iniciar PostgreSQL (se não inicia automaticamente)
- [ ] Executar back-end: `dotnet run --launch-profile http`
- [ ] Executar front-end: `npx expo start`

---

## 🎯 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Obter usuário atual |
| PUT | `/api/auth/profile` | Atualizar perfil |
| GET | `/api/auth/users` | Listar usuários |
| GET | `/api/plants` | Listar todas as plantas |
| GET | `/api/plants/my` | Minhas plantas |
| POST | `/api/plants` | Adicionar planta |
| PUT | `/api/plants/{id}` | Atualizar planta |
| DELETE | `/api/plants/{id}` | Deletar planta |
| GET | `/api/chats` | Listar chats |
| POST | `/api/chats` | Criar chat |
| GET | `/api/messages/chat/{id}` | Mensagens do chat |
| POST | `/api/messages` | Enviar mensagem |

Documentação completa: http://localhost:5041/swagger

---

## 🆘 Suporte

Se encontrar problemas:

1. 🔍 Verifique os logs do console (back-end e front-end)
2. 📖 Revise este README
3. 🧪 Teste cada componente separadamente
4. 🔄 Reinicie tudo (API, Expo, banco)

---

## 📝 Notas Importantes

- ⚠️ **Firewall**: Pode ser necessário criar uma regra para permitir a porta 5041
- ⚠️ **Rede**: Celular e PC devem estar na MESMA rede Wi-Fi
- ⚠️ **IP Dinâmico**: Se seu IP mudar, atualize `apiConfig.js`
- ⚠️ **HTTPS desabilitado**: Para facilitar o desenvolvimento local
- ⚠️ **CORS**: Configurado para aceitar qualquer origem (desenvolvimento)

---

## 🚀 Pronto!

Agora seu ScanPlant deve estar funcionando! 🎉

Se tudo estiver configurado corretamente:
1. A API responde em http://localhost:5041/swagger
2. O app conecta e permite criar conta
3. Você pode adicionar plantas e conversar com outros usuários

Bom desenvolvimento! 🌱
