using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using ScanPlantAPI.Data;
using ScanPlantAPI.Models;
using ScanPlantAPI.Services;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient("PlantId", client =>
{
    client.BaseAddress = new Uri("https://api.plant.id/v3/");
    client.Timeout = TimeSpan.FromSeconds(45);
});
builder.Services.AddHttpClient("Gemini", client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/v1beta/");
    client.Timeout = TimeSpan.FromSeconds(25);
});
builder.Services.AddHttpClient("Resend", client =>
{
    client.BaseAddress = new Uri("https://api.resend.com/");
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("ScanPlantAPI/1.0");
});
builder.Services.AddMemoryCache();

// SEGURANCA (disponibilidade): limita abuso, forca bruta e spam nos endpoints
// protegidos. A particao por IP protege login/cadastro; depois do login,
// assistente e mensagens sao limitados por usuario autenticado.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("assistant", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("messages", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

// Configure Swagger/OpenAPI com suporte a JWT
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ScanPlant API",
        Version = "v1",
        Description = "API REST para o aplicativo ScanPlant - Identificação de plantas com IA",      
        Contact = new OpenApiContact
        {
            Name = "ScanPlant Team",
            Email = "contato@scanplant.com"
        }
    });

    // Configurar autenticação JWT no Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando Bearer scheme. Digite 'Bearer' [espaço] e então seu token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// SEGURANCA (segredos): a string real vem da configuracao protegida do ambiente
// (Azure/variavel DATABASE_URL), nunca do frontend. O valor nao deve ser logado.
// Configure Database - PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' or DATABASE_URL environment variable not found.");
}

connectionString = NormalizePostgresConnectionString(connectionString);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null));
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// SEGURANCA (autenticacao): ASP.NET Identity aplica hash e salt nas senhas; a
// aplicacao nao armazena nem compara senha em texto puro. A politica abaixo
// tambem exige senha minimamente forte e bloqueia tentativas repetidas.
// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.Password.RequiredUniqueChars = 4;
    options.User.RequireUniqueEmail = true;
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Tokens de redefinicao sao temporarios e deixam de ser validos apos 30 minutos.
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromMinutes(30);
});

// SEGURANCA (integridade/autenticacao): todo JWT recebido precisa ter assinatura,
// emissor, audiencia e validade corretos. ClockSkew zero evita aceitar token alem
// da expiracao. JWT e assinado, nao criptografado: nunca coloque segredos nele.
// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("JWT Key not configured. Set Jwt:Key or the JWT__KEY environment variable.");
}
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// SEGURANCA (origem): CORS restringe quais sites podem chamar a API pelo navegador.
// Ele complementa, mas nao substitui, [Authorize] e as regras de propriedade.
// Em producao a aplicacao falha ao iniciar se a allowlist nao estiver configurada.
// Configure CORS. In production, set CORS_ALLOWED_ORIGINS to the frontend URL.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var configuredOrigins = builder.Configuration["Cors:AllowedOrigins"]
            ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");

        var allowedOrigins = configuredOrigins?
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (allowedOrigins is { Length: > 0 })
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            throw new InvalidOperationException(
                "CORS_ALLOWED_ORIGINS is required in production. Example: https://scanplant.vercel.app");
        }
    });
});

// Register Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddSingleton<IContentSafetyService, ContentSafetyService>();
builder.Services.AddSingleton<IPlantSafetyEnrichmentService, PlantSafetyEnrichmentService>();

var app = builder.Build();

// Prepare the database. Production uses versioned migrations; development keeps
// the existing local behavior for compatibility with databases created earlier.
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        logger.LogInformation("Verificando conexão com o banco de dados...");
        
        if (app.Environment.IsProduction())
        {
            await dbContext.Database.MigrateAsync();
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
        }
        
        logger.LogInformation("Banco de dados pronto!");
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Erro ao conectar ou criar o banco de dados. Verifique se o PostgreSQL está rodando e as credenciais estão corretas.");

    if (app.Environment.IsProduction())
    {
        throw;
    }

    logger.LogWarning("A aplicação continuará rodando, mas os endpoints que usam banco de dados não funcionarão.");
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ScanPlant API V1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "ScanPlant API - Swagger";
    });
}
else
{
    // HSTS orienta navegadores a reutilizarem HTTPS. No Azure, o TLS e encerrado
    // pelo proxy da plataforma antes de a requisicao chegar ao container.
    app.UseHsts();
}

// SEGURANCA (headers): defesa em profundidade contra interpretacao incorreta de
// conteudo, clickjacking e vazamento da URL de origem para outros sites.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

// app.UseHttpsRedirection(); // Desabilitado para desenvolvimento com dispositivos externos

// SEGURANCA: a ordem do pipeline importa. Primeiro aplica a politica de origem,
// depois valida o JWT, limita a requisicao e finalmente autoriza o endpoint.
// IMPORTANTE: CORS deve vir ANTES de Authentication/Authorization
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();
// O health check e anonimo de proposito para o monitor da hospedagem. Ele retorna
// somente estado operacional, sem credenciais, SQL ou detalhes de excecao.
app.MapGet("/health", async (ApplicationDbContext dbContext, CancellationToken cancellationToken) =>
{
    var databaseReady = await dbContext.Database.CanConnectAsync(cancellationToken);
    var response = new
    {
        status = databaseReady ? "ok" : "unavailable",
        service = "ScanPlantAPI",
        database = databaseReady ? "connected" : "disconnected",
        timestamp = DateTimeOffset.UtcNow
    };

    return databaseReady
        ? Results.Ok(response)
        : Results.Json(response, statusCode: StatusCodes.Status503ServiceUnavailable);
}).AllowAnonymous();

app.Run();

static string NormalizePostgresConnectionString(string connectionString)
{
    if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var uri)
        || (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
    {
        return connectionString;
    }

    var credentials = uri.UserInfo.Split(':', 2);
    if (credentials.Length != 2)
    {
        throw new InvalidOperationException("DATABASE_URL does not contain valid PostgreSQL credentials.");
    }

    var connectionBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.IsDefaultPort ? 5432 : uri.Port,
        Username = Uri.UnescapeDataString(credentials[0]),
        Password = Uri.UnescapeDataString(credentials[1]),
        Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
        Pooling = true
    };

    var query = uri.Query.TrimStart('?')
        .Split('&', StringSplitOptions.RemoveEmptyEntries)
        .Select(part => part.Split('=', 2))
        .Where(part => part.Length == 2)
        .ToDictionary(
            part => Uri.UnescapeDataString(part[0]),
            part => Uri.UnescapeDataString(part[1]),
            StringComparer.OrdinalIgnoreCase);

    if (query.TryGetValue("sslmode", out var sslMode)
        && Enum.TryParse<SslMode>(sslMode, ignoreCase: true, out var parsedSslMode))
    {
        connectionBuilder.SslMode = parsedSslMode;
    }

    return connectionBuilder.ConnectionString;
}

