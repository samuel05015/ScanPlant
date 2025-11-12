# ScanPlant API

API REST desenvolvida em ASP.NET Core 8.0 para o aplicativo ScanPlant - Sistema de identificação e gerenciamento de plantas com Inteligência Artificial.

##  Tecnologias

- **.NET 8.0** - Framework principal
- **ASP.NET Core Web API** - Framework para API REST
- **Entity Framework Core 9.0** - ORM
- **SQL Server** - Banco de dados
- **ASP.NET Core Identity** - Autenticação e autorização
- **JWT (JSON Web Tokens)** - Autenticação baseada em tokens
- **Swagger/OpenAPI** - Documentação interativa da API

##  Funcionalidades

### Autenticação (Auth)
-  Registro de usuários
-  Login com JWT
-  Obter perfil do usuário atual
-  Atualizar perfil
-  Listar usuários

### Plantas (Plants)
-  Criar planta (com imagem base64, geolocalização)
-  Listar plantas do usuário
-  Listar todas as plantas (comunidade)
-  Buscar planta por ID
-  Atualizar planta
-  Deletar planta
-  Transferir plantas órfãs
-  Filtros: cidade, família, lembretes ativos

### Chat (Chats)
-  Criar conversa
-  Listar conversas do usuário
-  Buscar conversa por ID
-  Marcar mensagens como lidas

### Mensagens (Messages)
-  Enviar mensagem
-  Listar mensagens de um chat
-  Marcar mensagem como lida
-  Contador de mensagens não lidas

##  Estrutura do Banco de Dados

### Tabelas Principais

1. **AspNetUsers** (ApplicationUser)
   - Id, Email, Name, Phone, Bio, AvatarUrl
   - ExperienceLevel, PlantPreference, City
   - CreatedAt, UpdatedAt

2. **Plants**
   - Id, UserId, ScientificName, CommonName, Family, Genus
   - WikiDescription, CareInstructions
   - ImageData (Base64), ImageUrl
   - Latitude, Longitude, City, LocationName
   - WateringFrequencyDays, ReminderEnabled
   - Notes, CreatedAt, UpdatedAt

3. **Chats**
   - Id, ParticipantIds (JSON)
   - LastMessage, LastMessageTime, LastSenderId
   - UnreadCount, CreatedAt

4. **ChatParticipants**
   - Id, ChatId, UserId, JoinedAt

5. **Messages**
   - Id, ChatId, SenderId, Content
   - Read, CreatedAt

##  Configuração e Instalação

### Pré-requisitos

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/sql-server) ou SQL Server LocalDB
- [Visual Studio 2022](https://visualstudio.microsoft.com/) ou [VS Code](https://code.visualstudio.com/)

### Passo a Passo

1. **Clone ou baixe o projeto**

2. **Configure a Connection String**
   
   Edite o arquivo `appsettings.json` e ajuste a connection string conforme seu ambiente:

   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ScanPlantDB;Trusted_Connection=True;MultipleActiveResultSets=true"
   }
   ```

   Para SQL Server:
   ```json
   "DefaultConnection": "Server=localhost;Database=ScanPlantDB;User Id=seu_usuario;Password=sua_senha;TrustServerCertificate=True"
   ```

3. **Configure a chave JWT (Opcional)**

   No `appsettings.json`, você pode alterar a chave secreta JWT:

   ```json
   "Jwt": {
     "Key": "SuaChaveSecretaSuperSeguraComPeloMenos32Caracteres!@#"
   }
   ```

4. **Instalar Dependências**

   ```bash
   dotnet restore
   ```

5. **Criar o Banco de Dados (Migration)**

   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

6. **Executar a API**

   ```bash
   dotnet run
   ```

   A API estará disponível em:
   - HTTPS: `https://localhost:7xxx`
   - HTTP: `http://localhost:5xxx`
   - **Swagger UI**: `https://localhost:7xxx` (raiz)

##  Documentação da API (Swagger)

Ao executar a aplicação, acesse a documentação interativa Swagger:

```
https://localhost:7xxx
```

Lá você encontrará:
- Todos os endpoints disponíveis
- Modelos de request/response
- Possibilidade de testar os endpoints
- Autenticação JWT integrada

##  Autenticação

A API usa JWT (JSON Web Tokens). Para usar endpoints protegidos:

1. **Registre um usuário** via `POST /api/auth/register`
2. **Faça login** via `POST /api/auth/login` e obtenha o token
3. **Use o token** nos headers das requisições:

```
Authorization: Bearer seu_token_jwt_aqui
```

No Swagger, clique no botão "Authorize" e digite: `Bearer seu_token_jwt_aqui`

##  Endpoints Principais

### Autenticação

```
POST   /api/auth/register        # Registrar usuário
POST   /api/auth/login           # Login
GET    /api/auth/me              # Perfil atual
PUT    /api/auth/profile         # Atualizar perfil
GET    /api/auth/users           # Listar usuários
GET    /api/auth/users/{id}      # Usuário por ID
```

### Plantas

```
POST   /api/plants               # Criar planta
GET    /api/plants               # Listar todas (comunidade)
GET    /api/plants/my            # Minhas plantas
GET    /api/plants/{id}          # Planta por ID
GET    /api/plants/user/{userId} # Plantas de um usuário
PUT    /api/plants/{id}          # Atualizar planta
DELETE /api/plants/{id}          # Deletar planta
GET    /api/plants/orphaned      # Plantas sem dono
POST   /api/plants/transfer      # Transferir plantas órfãs
```

### Chats

```
POST   /api/chats                # Criar chat
GET    /api/chats                # Meus chats
GET    /api/chats/{id}           # Chat por ID
PUT    /api/chats/{id}/read      # Marcar como lido
```

### Mensagens

```
POST   /api/messages             # Enviar mensagem
GET    /api/messages/{id}        # Mensagem por ID
GET    /api/messages/chat/{chatId} # Mensagens do chat
PUT    /api/messages/{id}/read   # Marcar como lida
GET    /api/messages/unread/count # Contador não lidas
```

##  Comandos Úteis

### Entity Framework Migrations

```bash
# Criar nova migration
dotnet ef migrations add NomeDaMigracao

# Aplicar migrations no banco
dotnet ef database update

# Remover última migration
dotnet ef migrations remove

# Ver SQL da migration
dotnet ef migrations script
```

### Build e Publish

```bash
# Build do projeto
dotnet build

# Publicar para produção
dotnet publish -c Release -o ./publish
```

##  Filtros e Queries

### Plantas

- `GET /api/plants?city=São Paulo` - Filtrar por cidade
- `GET /api/plants?family=Cactaceae` - Filtrar por família
- `GET /api/plants?reminderEnabled=true` - Apenas com lembretes

##  Estrutura do Projeto

```
ScanPlantAPI/
 Controllers/         # Controllers da API
    AuthController.cs
    PlantsController.cs
    ChatsController.cs
    MessagesController.cs
 Data/                # DbContext
    ApplicationDbContext.cs
 DTOs/                # Data Transfer Objects
    Auth/
    Plants/
    Chats/
    Messages/
 Models/              # Entidades do banco
    ApplicationUser.cs
    Plant.cs
    Chat.cs
    ChatParticipant.cs
    Message.cs
 Services/            # Serviços (JWT, etc)
    TokenService.cs
 Program.cs           # Configuração da aplicação
 appsettings.json     # Configurações
```

##  Troubleshooting

### Erro: Connection String

Se houver erro de conexão, verifique:
1. SQL Server está rodando
2. Connection string está correta
3. Usuário tem permissões

### Erro: JWT Key

Se houver erro "JWT Key not configured":
1. Verifique o `appsettings.json`
2. Certifique-se que a chave tem pelo menos 32 caracteres

### Erro: Migration

Se houver erro ao criar o banco:

```bash
# Deletar migrations antigas
Remove-Item -Recurse -Force Migrations

# Recriar
dotnet ef migrations add InitialCreate
dotnet ef database update
```

##  Desenvolvido por

**ScanPlant Team**  
Projeto de TCC - Sistema de Identificação de Plantas com IA

##  Licença

Este projeto é de uso acadêmico/educacional.

---

**Dúvidas?** Consulte a documentação Swagger ou entre em contato!
