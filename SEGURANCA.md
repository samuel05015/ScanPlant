# Segurança do ScanPlant

Este documento resume o que está implementado, como demonstrar e quais pontos ainda precisam evoluir. Ele evita confundir segurança da aplicação com segurança do conteúdo botânico.

## Visão geral

O ScanPlant usa defesa em profundidade (várias camadas de proteção; se uma falhar, outra ainda reduz o risco):

1. O frontend (parte visual executada no navegador) aceita os dados e envia requisições HTTPS (conexão criptografada entre navegador e servidor).
2. A API (serviço do servidor que recebe e responde às requisições) limita volume, valida formato e autentica o JWT (JSON Web Token: credencial digital assinada que identifica o usuário).
3. O controller (classe do backend que recebe uma rota da API) verifica se o usuário pode acessar o objeto solicitado (por exemplo, uma planta ou conversa do banco).
4. O Entity Framework (biblioteca que liga o código C# ao banco) gera consultas parametrizadas (comandos em que dados e SQL ficam separados, reduzindo risco de injeção de SQL) para o PostgreSQL (sistema de banco de dados usado pelo projeto).
5. Chaves externas e credenciais ficam no ambiente protegido do backend (parte executada no servidor, fora do navegador).
6. O deploy (processo de publicar a aplicação) adiciona headers de segurança (instruções HTTP enviadas ao navegador) no site.

## Controles implementados

### Autenticação e senhas

- ASP.NET Identity (biblioteca da Microsoft para usuários e senhas) armazena hash (resultado de uma função de mão única que não revela a senha original) com salt (valor aleatório acrescentado antes do hash para dificultar ataques), nunca a senha em texto puro.
- Senhas exigem no mínimo 8 caracteres, maiúscula, minúscula, número e 4 caracteres distintos.
- Email é único.
- Após 5 falhas, a conta entra em lockout (bloqueio temporário automático) por 15 minutos.
- Login e cadastro aceitam 8 tentativas por IP (endereço que identifica a origem da conexão) a cada 5 minutos.
- Erros de login usam a mesma mensagem para email inexistente ou senha errada, reduzindo enumeração de contas (tentativa de descobrir quais emails estão cadastrados observando respostas diferentes).
- O fluxo “Esqueci minha senha” responde sempre com a mesma mensagem, usa token temporário de 30 minutos e envia o link pelo backend para não expor a chave de email.

### JWT e autorização

- O token (credencial digital enviada em cada requisição autenticada) é assinado com HMAC-SHA256 (algoritmo que usa uma chave secreta para provar que o token não foi alterado) e expira em 2 horas.
- A API valida assinatura, emissor (quem criou o token), audiência (para qual aplicação ele foi criado) e expiração sem tolerância adicional.
- Controllers protegidos usam `[Authorize]` (marcação do ASP.NET que bloqueia requisições sem autenticação válida).
- O ID do usuário vem do claim (informação confiável incluída dentro do token assinado), não do corpo enviado pelo navegador.
- Alterar e excluir plantas exige ser o proprietário.
- Ler chats e mensagens exige ser participante da conversa.
- O frontend guarda o token em `sessionStorage` (armazenamento do navegador apagado ao fechar a aba), removendo a persistência antiga do `localStorage` (armazenamento que continua depois que o navegador é fechado).

### Segredos e integrações externas

- `DATABASE_URL` (variável com o endereço e as credenciais do banco), chave JWT, Plant.id e Gemini ficam no servidor/hospedagem.
- O frontend chama proxies autenticados (rotas intermediárias do backend que chamam outro serviço sem revelar a chave) e nunca recebe essas chaves.
- Há timeout (tempo máximo de espera) nas integrações externas e erros internos não são enviados ao cliente.
- O corpo retornado pelo serviço de imagens não é escrito em logs (registros técnicos de execução), evitando registrar imagens ou dados pessoais.

### Validação, abuso e conteúdo

- DTOs (objetos que definem exatamente quais dados uma rota aceita) usam `Required`, `StringLength`, `MaxLength`, `EmailAddress` e `Phone` para validar campos.
- O upload (envio de arquivo) de identificação tem limite HTTP de 12 MB (megabytes) e imagem codificada limitada a 10 MB.
- Assistente e mensagens possuem rate limiting (limite de requisições dentro de um período) por usuário.
- Mensagens ofensivas e pedidos operacionais sobre substâncias controladas são bloqueados.
- Perguntas sobre ingestão perigosa recebem orientação conservadora de emergência.
- A identificação botânica é probabilística (apresenta uma chance, não uma certeza) e exibe aviso para confirmação com especialista.

### Navegador e deploy

O `vercel.json` aplica:

- `Content-Security-Policy` ou CSP (política que define de onde o navegador pode carregar conteúdo): restringe scripts, conexões, imagens, fontes e formulários.
- `X-Frame-Options: DENY`: impede clickjacking (ataque que coloca o site dentro de uma camada ou quadro invisível para enganar cliques).
- `X-Content-Type-Options: nosniff`: impede o navegador de adivinhar um MIME type (identificação do tipo de arquivo, como imagem ou JavaScript) diferente do declarado.
- `Referrer-Policy`: reduz vazamento da URL (endereço da página) visitada para outros sites.
- `Permissions-Policy`: controla recursos do navegador; câmera e geolocalização ficam restritas ao próprio site e o microfone é bloqueado.

A API adiciona HSTS (regra que manda o navegador usar somente HTTPS nas próximas conexões) em produção e repete headers importantes como defesa em profundidade.

### Privacidade e disponibilidade

- Email e telefone não são mostrados na listagem de outros usuários.
- Plantas da comunidade dependem de consentimento registrado em `IsInCommunity` (campo verdadeiro ou falso que indica participação na comunidade).
- O modelo registra a intenção de compartilhar localização em `IsLocationPublic` (campo verdadeiro ou falso para localização pública).
- Retry de banco (nova tentativa automática após falha temporária), timeouts, health check (rota usada pela hospedagem para verificar se o serviço está funcionando) e respostas `429` (código HTTP para excesso de requisições) ajudam a disponibilidade.

## Onde mostrar cada controle no código

As linhas abaixo correspondem ao estado atual do projeto. Se o código mudar depois, procure também pelo nome da classe ou do método indicado.

### Controles implementados

| Questão de segurança | Onde abrir | O que mostrar ao professor |
|---|---|---|
| Hash e salt das senhas | `ScanPlantAPI/ScanPlantAPI/Program.cs:148` e `Controllers/AuthController.cs:71` | O ASP.NET Identity é configurado no servidor e `CreateAsync` recebe a senha para armazená-la com hash; a aplicação não grava senha em texto puro. |
| Política de senha, email único e bloqueio | `ScanPlantAPI/ScanPlantAPI/Program.cs:152-166` | Requisitos de senha, `RequireUniqueEmail`, cinco falhas e bloqueio de 15 minutos. |
| Proteção contra força bruta e spam | `ScanPlantAPI/ScanPlantAPI/Program.cs:37-77` e `Controllers/AuthController.cs:49,95,138,183` | Políticas de rate limiting e sua aplicação no cadastro, login e recuperação de senha. |
| Login sem enumeração de conta | `ScanPlantAPI/ScanPlantAPI/Controllers/AuthController.cs:98-120` | Email inexistente e senha incorreta retornam a mesma mensagem. |
| Emissão do JWT | `ScanPlantAPI/ScanPlantAPI/Services/TokenService.cs:23-62` | Claim de identidade, validade de duas horas e assinatura HMAC-SHA256. |
| Validação do JWT | `ScanPlantAPI/ScanPlantAPI/Program.cs:174-205` | Verificação de assinatura, emissor, audiência e expiração com `ClockSkew` igual a zero. |
| Rotas autenticadas | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantsController.cs:14`, `ChatsController.cs:14` e `MessagesController.cs:14` | O atributo `[Authorize]` bloqueia chamadas sem um JWT válido. |
| Identidade confiável do usuário | `ScanPlantAPI/ScanPlantAPI/Services/TokenService.cs:36-45` e `Controllers/PlantsController.cs:32-41` | O ID vem do claim assinado; o cliente não escolhe o proprietário de uma planta. |
| Propriedade para alterar/excluir planta | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantsController.cs:185-199` e `247-261` | A API compara `plant.UserId` com o usuário autenticado e responde `403` quando não é o dono. |
| Participação em chats e mensagens | `ScanPlantAPI/ScanPlantAPI/Controllers/ChatsController.cs:99-109,146-158` e `MessagesController.cs:97-122,179-181` | A API confirma que o usuário pertence à conversa antes de mostrar chat ou mensagens. |
| Validação dos dados recebidos | `ScanPlantAPI/ScanPlantAPI/DTOs/Auth/AuthDtos.cs:5-53`, `DTOs/Messages/MessageDtos.cs:7-12` e `DTOs/Plants/PlantDtos.cs` | Atributos como `Required`, `EmailAddress`, `StringLength` e `MaxLength` rejeitam formatos e tamanhos inválidos. |
| Segredo do banco no servidor | `ScanPlantAPI/ScanPlantAPI/Program.cs:120-145` | A conexão vem da configuração ou de `DATABASE_URL`; logs sensíveis só podem existir em desenvolvimento. |
| Segredos das APIs externas | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantIdentificationController.cs:59-80`, `Services/PlantSafetyEnrichmentService.cs:107-110` e `Services/EmailService.cs:33-44` | Plant.id, Gemini e Resend são lidos no backend e nunca enviados ao navegador. |
| Recuperação sem revelar contas | `ScanPlantAPI/ScanPlantAPI/Controllers/AuthController.cs:137-176` | A resposta é sempre genérica e até falhas de email são escondidas do cliente para não confirmar que um endereço está cadastrado. |
| Token temporário de recuperação | `ScanPlantAPI/ScanPlantAPI/Program.cs:168-172` e `Controllers/AuthController.cs:157-205` | O token expira em 30 minutos, é codificado para URL e validado pelo ASP.NET Identity antes da troca. |
| Link seguro e chave de email protegida | `ScanPlantAPI/ScanPlantAPI/Controllers/AuthController.cs:387-402` e `Services/EmailService.cs:28-81` | Produção exige URL HTTPS; a chave fica em `RESEND_API_KEY` no Azure e o link é escapado antes de entrar no HTML. |
| Interface da recuperação | `scanplant-web/src/pages/LoginScreen.tsx:87-111`, `ForgotPasswordScreen.tsx` e `ResetPasswordScreen.tsx` | O link fica abaixo da senha; as telas apenas chamam a API, sem possuir a chave do Resend. |
| Armazenamento e envio do JWT no navegador | `scanplant-web/src/api.ts:20-39,45-75,93-96` | O frontend detecta expiração para experiência do usuário, guarda o token em `sessionStorage` e o envia no header `Authorization: Bearer`. A validação real continua no backend. |
| CORS | `ScanPlantAPI/ScanPlantAPI/Program.cs:207-235,315-322` | A allowlist define quais origens podem chamar a API no navegador e é aplicada antes da autenticação. |
| Headers do navegador | `vercel.json:9-17` e `ScanPlantAPI/ScanPlantAPI/Program.cs:296-310` | CSP, proteção contra iframe, `nosniff`, política de referência e HSTS em produção. |
| Upload e integrações externas | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantIdentificationController.cs:14-19,41-57,82-120` e `Program.cs:19-33` | Identificação exige login, limita o tamanho da imagem, usa timeout e não devolve nem registra o corpo de erro do provedor. |
| Segurança de conteúdo | `ScanPlantAPI/ScanPlantAPI/Services/ContentSafetyService.cs:54-94` e `Controllers/PlantAssistantController.cs:22-43` | Bloqueio de abuso e de instruções sobre substâncias controladas, além de orientação conservadora em possível intoxicação. |
| Privacidade na listagem de usuários | `ScanPlantAPI/ScanPlantAPI/Controllers/AuthController.cs:327-376` | Email e telefone ficam vazios para outros usuários e só aparecem para o próprio dono. |
| Disponibilidade e monitoramento | `ScanPlantAPI/ScanPlantAPI/Program.cs:137-145,325-341` | Retry do PostgreSQL e rota `/health`, que informa apenas estado operacional. |

### Pendências que o próprio código evidencia

| Limitação conhecida | Onde mostrar no código |
|---|---|
| IDOR na leitura direta de planta | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantsController.cs:87-101`; o comentário nas linhas 92-94 explica que ainda falta restringir ao dono ou à comunidade. |
| Plantas privadas na consulta por usuário | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantsController.cs:164-176`; a consulta ainda não diferencia o próprio usuário de visitantes. |
| Coordenadas em respostas públicas | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantsController.cs:322-352`; o mapeamento ainda inclui latitude e longitude sem aplicar `IsLocationPublic`. |
| Transferência de plantas órfãs | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantsController.cs:289-314`; o comentário pede remoção ou role administrativa. |
| Identificação sem limitador próprio | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantIdentificationController.cs:14-16`; existe autenticação, mas o comentário registra a falta de rate limiting específico. |
| MIME real da imagem não validado | `ScanPlantAPI/ScanPlantAPI/Controllers/PlantIdentificationController.cs:41-75`; há limite de tamanho, mas não inspeção robusta do tipo real do arquivo. |
| JWT sem refresh, revogação ou 2FA | `ScanPlantAPI/ScanPlantAPI/Services/TokenService.cs:48-58`; existe apenas token de acesso com duas horas de validade. |
| Token acessível a JavaScript | `scanplant-web/src/api.ts:34-39`; `sessionStorage` reduz persistência, mas ainda pode ser lido caso ocorra XSS. |
| CSP com estilo inline | `vercel.json:15`; `style-src` ainda contém `'unsafe-inline'`. |
| Rate limiting em memória | `ScanPlantAPI/ScanPlantAPI/Program.cs:35-77`; os contadores não são compartilhados entre várias instâncias da API. |
| Auditoria e testes automatizados de segurança | Não existe implementação específica ainda; por isso aparece como melhoria futura, e não como controle concluído. |

## Limitações conhecidas

Estas são melhorias futuras, não controles já concluídos:

- `GET /api/plants/{id}` (rota que busca uma planta pelo identificador) ainda precisa restringir leitura ao dono ou a plantas públicas. Essa falha é conhecida como IDOR (acesso indevido a um objeto ao trocar seu identificador na URL).
- `GET /api/plants/user/{userId}` deve ocultar plantas privadas de outros usuários.
- As respostas públicas ainda precisam remover coordenadas quando `IsLocationPublic` for falso.
- O endpoint (endereço específico de uma função da API) de transferência de plantas órfãs deve ser removido ou exigir administrador.
- A identificação de plantas precisa de rate limiting próprio para usuários autenticados.
- O servidor ainda não valida de forma robusta o MIME type real do arquivo de imagem.
- O JWT não tem refresh token (credencial separada para obter um novo token), revogação persistente (forma de invalidar um token antes de expirar), 2FA (segundo fator de autenticação, como código no celular) ou confirmação de email.
- `sessionStorage` reduz persistência, mas um XSS (injeção de JavaScript malicioso na página) ainda pode acessar o token.
- A CSP ainda permite estilo inline (CSS escrito diretamente no HTML) por causa do frontend atual.
- O rate limiting é em memória; ao reiniciar ou escalar a API (executar mais de uma cópia do servidor), os contadores não são compartilhados.
- Não há ainda trilha de auditoria centralizada (histórico confiável de quem realizou cada ação) nem testes automatizados específicos de segurança.

## Configuração do email de recuperação

O backend usa o Resend (serviço externo de envio de emails). Configure estas variáveis protegidas no Azure:

- `RESEND_API_KEY`: chave secreta criada no painel do Resend.
- `EMAIL_FROM`: remetente de um domínio verificado, por exemplo `ScanPlant <contato@seudominio.com>`.
- `FRONTEND_BASE_URL`: endereço público do site, atualmente `https://scan-plant-front-back-end.vercel.app`.

No ambiente de produção atual, as três variáveis estão configuradas no Azure App Service e a recuperação foi testada. O valor de `RESEND_API_KEY` não está no repositório nem no frontend.

Para testes, `onboarding@resend.dev` pode ser usado como remetente, mas normalmente envia apenas para o endereço proprietário da conta Resend. Para usuários reais, é necessário verificar um domínio com SPF e DKIM (registros de DNS que autorizam o envio e ajudam a provar que o email não foi falsificado).

Regra operacional: uma chave secreta nunca deve aparecer em código, commit, slide, captura de tela ou conversa. Se uma chave for exposta, ela deve ser revogada (invalidada no provedor) e substituída no Azure.

## Roteiro de apresentação em 2 minutos

1. **Ameaça:** “Considerei roubo de conta, acesso a dados de outro usuário, abuso da API, vazamento de chaves e conteúdo perigoso.”
2. **Autenticação:** mostre `Program.cs`, a política de senha, lockout (bloqueio após falhas) e validação JWT (verificação da credencial digital).
3. **Autorização:** mostre a checagem `plant.UserId != userId` e a verificação de participante nos chats.
4. **Segredos:** mostre que Plant.id, Gemini, banco e JWT são lidos da configuração do backend.
5. **Defesa em profundidade:** mostre rate limiting, limites de upload, CORS (regra que limita quais sites podem chamar a API pelo navegador) e headers do `vercel.json`.
6. **Maturidade:** encerre apresentando as limitações acima e a ordem de correção.

Uma resposta boa para “o sistema é seguro?” é: “Ele possui controles concretos em várias camadas e reduz riscos comuns, mas segurança é contínua. Eu também documentei lacunas de autorização, sessão e auditoria que seriam as próximas prioridades.”
