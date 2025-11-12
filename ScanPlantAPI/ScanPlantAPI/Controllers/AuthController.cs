using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    /// <summary>
    /// Registrar novo usuário
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email já está em uso" });
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Name = dto.Name,
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
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
    }

    /// <summary>
    /// Login de usuário
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return Unauthorized(new { message = "Email ou senha inválidos" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);

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
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
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
                Id = u.Id,
                Email = u.Email!,
                Name = u.Name,
                Phone = u.Phone,
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
        var user = await _userManager.FindByIdAsync(id);
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
}
