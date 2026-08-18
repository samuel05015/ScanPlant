using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using ScanPlantAPI.DTOs.Auth;
using ScanPlantAPI.Models;
using ScanPlantAPI.Services;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        IEmailService emailService,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Registrar novo usuário
    /// </summary>
    [HttpPost("register")]
    // Limite por IP reduz criacao automatizada de contas e abuso deste endpoint publico.
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var email = dto.Email.Trim();
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            // Mensagem generica reduz enumeracao de contas por atacantes.
            return BadRequest(new { message = "Não foi possível criar a conta com os dados informados." });
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Name = dto.Name?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        var token = _tokenService.GenerateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email!,
            Name = user.Name,
            ExpiresAt = DateTime.UtcNow.AddHours(2)
        });
    }

    /// <summary>
    /// Login de usuário
    /// </summary>
    [HttpPost("login")]
    // Primeira camada contra forca bruta; o lockout do Identity e a segunda.
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (user == null)
        {
            return Unauthorized(new { message = "Email ou senha inválidos" });
        }

        // Identity verifica o hash da senha. lockoutOnFailure contabiliza falhas
        // e bloqueia temporariamente a conta apos o limite configurado.
        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return StatusCode(
                StatusCodes.Status429TooManyRequests,
                new { message = "Acesso temporariamente bloqueado. Aguarde 15 minutos." });
        }

        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Email ou senha inválidos" });
        }

        var token = _tokenService.GenerateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email!,
            Name = user.Name,
            ExpiresAt = DateTime.UtcNow.AddHours(2)
        });
    }

    /// <summary>
    /// Enviar link temporario para redefinicao de senha
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordDto dto,
        CancellationToken cancellationToken)
    {
        const string genericMessage =
            "Se existir uma conta com este email, enviaremos as instrucoes de redefinicao.";

        var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (user?.Email is null)
        {
            // A resposta e identica para conta existente ou inexistente. Isso evita
            // enumeracao de usuarios por meio deste endpoint publico.
            return Ok(new { message = genericMessage });
        }

        try
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var resetUrl = BuildPasswordResetUrl(user.Email, encodedToken);

            await _emailService.SendPasswordResetAsync(
                user.Email,
                resetUrl,
                cancellationToken);
        }
        catch (Exception exception)
        {
            // Nao devolvemos o erro ao cliente porque isso revelaria que o email existe.
            // O UserId permite investigar a falha sem registrar o endereco de email.
            _logger.LogError(
                exception,
                "Falha ao enviar redefinicao de senha para o usuario {UserId}.",
                user.Id);
        }

        return Ok(new { message = genericMessage });
    }

    /// <summary>
    /// Trocar a senha usando o token temporario recebido por email
    /// </summary>
    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        const string invalidLinkMessage = "O link de redefinicao e invalido ou expirou.";
        var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (user is null)
        {
            return BadRequest(new { message = invalidLinkMessage });
        }

        string decodedToken;
        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        }
        catch (FormatException)
        {
            return BadRequest(new { message = invalidLinkMessage });
        }

        var result = await _userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(error => error.Code == "InvalidToken"))
            {
                return BadRequest(new { message = invalidLinkMessage });
            }

            return BadRequest(new
            {
                message = "A nova senha nao atende aos requisitos de seguranca.",
                errors = result.Errors.Select(error => error.Description)
            });
        }

        // Remove bloqueios causados por tentativas anteriores depois que o dono
        // comprovou acesso ao email e alterou a senha com um token valido.
        await _userManager.ResetAccessFailedCountAsync(user);
        await _userManager.SetLockoutEndDateAsync(user, null);

        return Ok(new { message = "Senha redefinida com sucesso." });
    }

    /// <summary>
    /// Obter dados do usuário atual
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
    {
        // O ID vem do JWT ja validado, e nao de um parametro controlado pelo cliente.
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email!,
            Name = user.Name,
            Phone = user.Phone,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            ExperienceLevel = user.ExperienceLevel,
            PlantPreference = user.PlantPreference,
            City = user.City,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        });
    }

    /// <summary>
    /// Atualizar perfil do usuário
    /// </summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        // Vincular a alteracao ao claim impede editar o perfil de outra pessoa (IDOR).
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        // Atualizar campos
        if (dto.Name != null) user.Name = dto.Name;
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.ExperienceLevel != null) user.ExperienceLevel = dto.ExperienceLevel;
        if (dto.PlantPreference != null) user.PlantPreference = dto.PlantPreference;
        if (dto.City != null) user.City = dto.City;

        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email!,
            Name = user.Name,
            Phone = user.Phone,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            ExperienceLevel = user.ExperienceLevel,
            PlantPreference = user.PlantPreference,
            City = user.City,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        });
    }

    /// <summary>
    /// Listar todos os usuários (exceto o atual)
    /// </summary>
    [HttpGet("users")]
    [Authorize]
    [ProducesResponseType(typeof(List<UserProfileDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UserProfileDto>>> GetUsers()
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var users = await _userManager.Users
            .Where(u => u.Id != currentUserId)
            .OrderBy(u => u.Name)
            .Select(u => new UserProfileDto
            {
                // Minimizacao de dados: email e telefone nao sao expostos na lista publica.
                Id = u.Id,
                Email = string.Empty,
                Name = u.Name,
                Phone = null,
                Bio = u.Bio,
                AvatarUrl = u.AvatarUrl,
                ExperienceLevel = u.ExperienceLevel,
                PlantPreference = u.PlantPreference,
                City = u.City,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Obter usuário por ID
    /// </summary>
    [HttpGet("users/{id}")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserProfileDto>> GetUserById(string id)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            // Dados de contato so retornam quando o usuario consulta o proprio perfil.
            Email = user.Id == currentUserId ? user.Email! : string.Empty,
            Name = user.Name,
            Phone = user.Id == currentUserId ? user.Phone : null,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            ExperienceLevel = user.ExperienceLevel,
            PlantPreference = user.PlantPreference,
            City = user.City,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        });
    }

    private string BuildPasswordResetUrl(string email, string encodedToken)
    {
        var configuredBaseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
            ?? _configuration["Email:FrontendBaseUrl"];

        if (!Uri.TryCreate(configuredBaseUrl, UriKind.Absolute, out var baseUri)
            || (baseUri.Scheme != Uri.UriSchemeHttps && baseUri.Scheme != Uri.UriSchemeHttp)
            || (_environment.IsProduction() && baseUri.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException(
                "Email:FrontendBaseUrl deve ser uma URL absoluta HTTPS em producao.");
        }

        return $"{baseUri.ToString().TrimEnd('/')}/reset-password" +
               $"?email={Uri.EscapeDataString(email)}" +
               $"&token={Uri.EscapeDataString(encodedToken)}";
    }
}
