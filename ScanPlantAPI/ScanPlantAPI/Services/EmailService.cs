using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Encodings.Web;

namespace ScanPlantAPI.Services;

public interface IEmailService
{
    Task SendPasswordResetAsync(
        string recipientEmail,
        string resetUrl,
        CancellationToken cancellationToken = default);
}

public sealed class ResendEmailService : IEmailService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ResendEmailService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task SendPasswordResetAsync(
        string recipientEmail,
        string resetUrl,
        CancellationToken cancellationToken = default)
    {
        // A chave nunca e enviada ao navegador. Em producao, configure RESEND_API_KEY
        // como segredo do Azure e use um remetente de dominio verificado.
        var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY")
            ?? _configuration["Email:ResendApiKey"];
        var from = Environment.GetEnvironmentVariable("EMAIL_FROM")
            ?? _configuration["Email:From"];

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(from))
        {
            throw new InvalidOperationException(
                "Email de recuperacao nao configurado. Defina RESEND_API_KEY e EMAIL_FROM.");
        }

        var safeResetUrl = HtmlEncoder.Default.Encode(resetUrl);
        var html = $$"""
            <!doctype html>
            <html lang="pt-BR">
              <body style="margin:0;background:#f3f6f2;font-family:Arial,sans-serif;color:#173b2a">
                <div style="max-width:560px;margin:0 auto;padding:40px 20px">
                  <div style="background:#ffffff;border:1px solid #dbe5dc;border-radius:20px;padding:32px">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#39744f">ScanPlant</p>
                    <h1 style="margin:0 0 16px;font-size:28px">Redefina sua senha</h1>
                    <p style="margin:0 0 24px;line-height:1.6;color:#52645a">Recebemos uma solicitação para trocar a senha da sua conta. O link abaixo expira em 30 minutos.</p>
                    <a href="{{safeResetUrl}}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#276342;color:#ffffff;text-decoration:none;font-weight:700">Criar nova senha</a>
                    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#708077">Se você não solicitou a troca, ignore este email. Sua senha atual continuará válida.</p>
                  </div>
                </div>
              </body>
            </html>
            """;

        using var request = new HttpRequestMessage(HttpMethod.Post, "emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new
        {
            from,
            to = new[] { recipientEmail },
            subject = "Redefinição de senha do ScanPlant",
            html,
            text = $"Redefina sua senha do ScanPlant em até 30 minutos: {resetUrl}\n\nSe você não solicitou a troca, ignore este email."
        });

        var client = _httpClientFactory.CreateClient("Resend");
        using var response = await client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Resend respondeu com status {(int)response.StatusCode}.");
        }
    }
}
