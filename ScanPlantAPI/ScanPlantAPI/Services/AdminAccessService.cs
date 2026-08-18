using Microsoft.AspNetCore.Identity;
using ScanPlantAPI.Models;

namespace ScanPlantAPI.Services;

public interface IAdminAccessService
{
    Task<bool> EnsureAdminAccessAsync(ApplicationUser user);
}

public sealed class AdminAccessService : IAdminAccessService
{
    public const string AdminRole = "Admin";

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAccessService> _logger;

    public AdminAccessService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ILogger<AdminAccessService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> EnsureAdminAccessAsync(ApplicationUser user)
    {
        var email = user.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email) || !GetConfiguredAdminEmails().Contains(email))
        {
            return await _userManager.IsInRoleAsync(user, AdminRole);
        }

        if (!await _roleManager.RoleExistsAsync(AdminRole))
        {
            var createRole = await _roleManager.CreateAsync(new IdentityRole(AdminRole));
            if (!createRole.Succeeded)
            {
                throw new InvalidOperationException("Nao foi possivel criar a role administrativa.");
            }
        }

        if (!await _userManager.IsInRoleAsync(user, AdminRole))
        {
            var addRole = await _userManager.AddToRoleAsync(user, AdminRole);
            if (!addRole.Succeeded)
            {
                throw new InvalidOperationException("Nao foi possivel conceder acesso administrativo.");
            }

            _logger.LogInformation("Acesso administrativo concedido ao usuario {UserId}.", user.Id);
        }

        return true;
    }

    private HashSet<string> GetConfiguredAdminEmails()
    {
        var configured = Environment.GetEnvironmentVariable("ADMIN_EMAILS")
            ?? _configuration["Admin:Emails"]
            ?? string.Empty;

        return configured
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
