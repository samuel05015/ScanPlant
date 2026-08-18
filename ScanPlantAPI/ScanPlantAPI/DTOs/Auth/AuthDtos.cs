using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "A senha deve ter entre 8 e 100 caracteres")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Name { get; set; }
}

public class LoginDto
{
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
    [StringLength(100, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class UpdateProfileDto
{
    [MaxLength(120)]
    public string? Name { get; set; }

    [Phone(ErrorMessage = "Número de telefone inválido")]
    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(1000)]
    public string? Bio { get; set; }
    [MaxLength(2_000_000)]
    public string? AvatarUrl { get; set; }
    [MaxLength(80)]
    public string? ExperienceLevel { get; set; }
    [MaxLength(120)]
    public string? PlantPreference { get; set; }
    [MaxLength(120)]
    public string? City { get; set; }
}

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? ExperienceLevel { get; set; }
    public string? PlantPreference { get; set; }
    public string? City { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
