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

Para testes, `onboarding@resend.dev` pode ser usado como remetente, mas normalmente envia apenas para o endereço proprietário da conta Resend. Para usuários reais, é necessário verificar um domínio com SPF e DKIM (registros de DNS que autorizam o envio e ajudam a provar que o email não foi falsificado).

## Roteiro de apresentação em 2 minutos

1. **Ameaça:** “Considerei roubo de conta, acesso a dados de outro usuário, abuso da API, vazamento de chaves e conteúdo perigoso.”
2. **Autenticação:** mostre `Program.cs`, a política de senha, lockout (bloqueio após falhas) e validação JWT (verificação da credencial digital).
3. **Autorização:** mostre a checagem `plant.UserId != userId` e a verificação de participante nos chats.
4. **Segredos:** mostre que Plant.id, Gemini, banco e JWT são lidos da configuração do backend.
5. **Defesa em profundidade:** mostre rate limiting, limites de upload, CORS (regra que limita quais sites podem chamar a API pelo navegador) e headers do `vercel.json`.
6. **Maturidade:** encerre apresentando as limitações acima e a ordem de correção.

Uma resposta boa para “o sistema é seguro?” é: “Ele possui controles concretos em várias camadas e reduz riscos comuns, mas segurança é contínua. Eu também documentei lacunas de autorização, sessão e auditoria que seriam as próximas prioridades.”
