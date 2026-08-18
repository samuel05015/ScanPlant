using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ScanPlantAPI.Models;

namespace ScanPlantAPI.Services;

public interface ITokenService
{
    string GenerateToken(ApplicationUser user);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(ApplicationUser user)
    {
        // A chave de assinatura fica no backend. Se ela nao estiver configurada,
        // falhar e mais seguro do que emitir tokens com uma chave padrao.
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("JWT Key not configured. Set Jwt:Key or the JWT__KEY environment variable.");
        }

        var key = Encoding.ASCII.GetBytes(jwtKey);
        var tokenHandler = new JwtSecurityTokenHandler();

        var claims = new List<Claim>
        {
            // NameIdentifier e a identidade confiavel usada pelos controllers.
            // O servidor nunca aceita um userId enviado pelo cliente como prova de identidade.
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.Name ?? user.Email ?? string.Empty),
            // Jti identifica unicamente o token e prepara o sistema para uma futura
            // lista de revogacao/auditoria.
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            // Janela curta reduz o impacto de um token roubado. Hoje nao existe
            // refresh token; ao expirar, o usuario autentica novamente.
            Expires = DateTime.UtcNow.AddHours(2),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"]
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
