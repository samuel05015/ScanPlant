using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScanPlantAPI.Services;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/plant-identification")]
// O proxy autenticado esconde a chave Plant.id do navegador e impede uso anonimo da cota.
// PENDENCIA: adicionar rate limiting especifico para controlar tambem usuarios autenticados.
[Authorize]
public class PlantIdentificationController : ControllerBase
{
    private const int MaxEncodedImageLength = 10 * 1024 * 1024;
    private static readonly JsonSerializerOptions SafetyJsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IPlantSafetyEnrichmentService _safetyEnrichment;
    private readonly ILogger<PlantIdentificationController> _logger;

    public PlantIdentificationController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IPlantSafetyEnrichmentService safetyEnrichment,
        ILogger<PlantIdentificationController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _safetyEnrichment = safetyEnrichment;
        _logger = logger;
    }

    [HttpPost]
    // Duplo limite: tamanho HTTP total e comprimento da imagem codificada. Isso reduz
    // risco de esgotamento de memoria por uploads excessivos.
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<IActionResult> Identify(
        [FromBody] IdentifyPlantRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Image))
        {
            return BadRequest(new { message = "Envie uma imagem para identificação." });
        }

        if (request.Image.Length > MaxEncodedImageLength)
        {
            return BadRequest(new { message = "A imagem excede o limite de 10 MB." });
        }

        // A chave e lida somente no servidor e enviada diretamente ao provedor externo.
        var apiKey = _configuration["PlantId:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogError("PlantId:ApiKey não está configurada.");
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "O serviço de identificação não está configurado." });
        }

        var image = StripDataUrlPrefix(request.Image);
        var client = _httpClientFactory.CreateClient("PlantId");

        using var upstreamRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "identification?details=common_names,taxonomy,description,edible_parts,watering&language=pt");
        upstreamRequest.Headers.TryAddWithoutValidation("Api-Key", apiKey);
        upstreamRequest.Content = JsonContent.Create(new
        {
            images = new[] { image },
            similar_images = true
        });

        try
        {
            using var response = await client.SendAsync(upstreamRequest, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var enrichedResponse = await AddSafetyAssessmentAsync(responseBody, cancellationToken);
                return Content(enrichedResponse, "application/json", Encoding.UTF8);
            }

            // O corpo do provedor nao e logado para evitar registrar imagens ou dados do usuario.
            _logger.LogWarning(
                "Plant.id respondeu com status {StatusCode}.",
                (int)response.StatusCode);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                return StatusCode(
                    StatusCodes.Status429TooManyRequests,
                    new { message = "O limite de identificações foi atingido. Tente novamente mais tarde." });
            }

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new { message = "Não foi possível identificar a planta neste momento." });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                new { message = "O serviço de identificação demorou demais para responder." });
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Falha de comunicação com o Plant.id.");
            return StatusCode(
                StatusCodes.Status502BadGateway,
                new { message = "Não foi possível acessar o serviço de identificação." });
        }
    }

    private static string StripDataUrlPrefix(string image)
    {
        if (!image.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return image;
        }

        var separatorIndex = image.IndexOf(',');
        return separatorIndex >= 0 ? image[(separatorIndex + 1)..] : image;
    }

    private async Task<string> AddSafetyAssessmentAsync(
        string responseBody,
        CancellationToken cancellationToken)
    {
        var root = JsonNode.Parse(responseBody)?.AsObject();
        if (root is null)
        {
            return responseBody;
        }

        var suggestion = root["result"]?["classification"]?["suggestions"]?[0];
        var scientificName = suggestion?["name"]?.GetValue<string>()?.Trim() ?? string.Empty;
        var probability = suggestion?["probability"]?.GetValue<double?>();
        var details = suggestion?["details"];
        var edibleParts = details?["edible_parts"] as JsonArray;
        var commonNames = (details?["common_names"] as JsonArray)?
            .Select(node => node?.GetValue<string>())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Cast<string>()
            .ToArray() ?? [];
        var ediblePartNames = edibleParts?
            .Select(node => node?.GetValue<string>())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Cast<string>()
            .ToArray() ?? [];
        var family = details?["taxonomy"]?["family"]?.GetValue<string>();

        var assessment = await _safetyEnrichment.EnrichAsync(
            new PlantSafetyContext(
                scientificName,
                family,
                commonNames,
                ediblePartNames,
                probability),
            cancellationToken);

        root["scanplant_safety"] = JsonSerializer.SerializeToNode(
            assessment,
            SafetyJsonOptions);

        return root.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
    }
}

public sealed record IdentifyPlantRequest(string Image);
