using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "A senha deve ter entre 6 e 100 caracteres")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Name { get; set; }
}

public class LoginDto
{
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
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
    [MaxLength(200)]
    public string? Name { get; set; }

    [Phone(ErrorMessage = "Número de telefone inválido")]
    public string? Phone { get; set; }

    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? ExperienceLevel { get; set; }
    public string? PlantPreference { get; set; }
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
