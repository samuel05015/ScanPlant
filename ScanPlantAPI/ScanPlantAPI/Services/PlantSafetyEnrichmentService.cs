using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace ScanPlantAPI.Services;

public interface IPlantSafetyEnrichmentService
{
    Task<PlantSafetyAssessment> EnrichAsync(
        PlantSafetyContext context,
        CancellationToken cancellationToken);
}

public sealed record PlantSafetyContext(
    string ScientificName,
    string? Family,
    IReadOnlyList<string> CommonNames,
    IReadOnlyList<string> EdibleParts,
    double? IdentificationConfidence);

public sealed record PlantSafetySource(
    string Label,
    string Url,
    string Kind);

public sealed record PlantSafetyAssessment(
    string ScientificNameAssessed,
    double? Confidence,
    string ToxicityStatus,
    string ToxicityNote,
    string EdibilityStatus,
    string EdibilityNote,
    IReadOnlyList<string> EdibleParts,
    string LegalStatus,
    string LegalNote,
    string AssessmentOrigin,
    DateTimeOffset AssessedAt,
    IReadOnlyList<PlantSafetySource> Sources,
    string Disclaimer);

public sealed class PlantSafetyEnrichmentService : IPlantSafetyEnrichmentService
{
    private const string DefaultModel = "gemini-2.5-flash";
    private const string Disclaimer =
        "Resultado informativo e probabilístico. Não confirma que a planta seja segura para ingestão, " +
        "contato, cultivo, posse ou comércio. Confirme com especialistas e autoridades competentes.";

    private static readonly string[] PotentiallyToxicTaxa =
    [
        "nerium oleander", "ricinus communis", "dieffenbachia", "datura",
        "brugmansia", "euphorbia", "philodendron", "spathiphyllum",
        "zantedeschia", "thevetia peruviana"
    ];

    private static readonly string[] RegulatedTaxa =
    [
        "cannabis", "erythroxylum coca", "papaver somniferum"
    ];

    private static readonly HashSet<string> ToxicityStatuses =
        new(StringComparer.OrdinalIgnoreCase) { "potentially_toxic", "no_evidence_found", "unknown" };

    private static readonly HashSet<string> EdibilityStatuses =
        new(StringComparer.OrdinalIgnoreCase) { "reported_edible", "not_edible", "unknown" };

    private static readonly HashSet<string> LegalStatuses =
        new(StringComparer.OrdinalIgnoreCase) { "possibly_regulated", "not_listed", "unknown" };

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<PlantSafetyEnrichmentService> _logger;

    public PlantSafetyEnrichmentService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<PlantSafetyEnrichmentService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public async Task<PlantSafetyAssessment> EnrichAsync(
        PlantSafetyContext context,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"plant-safety:{Normalize(context.ScientificName)}";
        if (_cache.TryGetValue(cacheKey, out PlantSafetyAssessment? cached) && cached is not null)
        {
            return cached with
            {
                Confidence = context.IdentificationConfidence,
                EdibleParts = context.EdibleParts
            };
        }

        var fallback = BuildConservativeAssessment(context);
        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogInformation("Gemini:ApiKey não configurada; usando avaliação conservadora.");
            return fallback;
        }

        var assessment = fallback;
        try
        {
            var aiResult = await RequestGeminiAssessmentAsync(context, apiKey, cancellationToken);
            assessment = MergeWithDeterministicRules(context, fallback, aiResult);
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                exception,
                "A consulta ao Gemini expirou para {ScientificName}; usando fallback seguro.",
                context.ScientificName);
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException)
        {
            _logger.LogWarning(
                exception,
                "Não foi possível enriquecer {ScientificName} com Gemini; usando fallback seguro.",
                context.ScientificName);
        }

        _cache.Set(cacheKey, assessment, TimeSpan.FromDays(7));
        return assessment;
    }

    private async Task<GeminiSafetyResult> RequestGeminiAssessmentAsync(
        PlantSafetyContext context,
        string apiKey,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("Gemini");
        var model = _configuration["Gemini:Model"]?.Trim();
        if (string.IsNullOrWhiteSpace(model)) model = DefaultModel;

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"models/{Uri.EscapeDataString(model)}:generateContent");
        request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
        request.Content = JsonContent.Create(new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = BuildPrompt(context) } }
                }
            },
            generationConfig = new
            {
                temperature = 0.1,
                maxOutputTokens = 2048,
                thinkingConfig = new { thinkingBudget = 0 },
                responseMimeType = "application/json",
                responseSchema = BuildResponseSchema()
            }
        });

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Gemini respondeu com status {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }

        var root = JsonDocument.Parse(responseBody);
        var text = root.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new JsonException("Gemini não retornou uma avaliação estruturada.");
        }

        return JsonSerializer.Deserialize<GeminiSafetyResult>(text, JsonOptions)
            ?? throw new JsonException("A avaliação estruturada da Gemini está vazia.");
    }

    private static PlantSafetyAssessment BuildConservativeAssessment(PlantSafetyContext context)
    {
        var normalizedName = Normalize(context.ScientificName);
        var isPotentiallyToxic = PotentiallyToxicTaxa.Any(normalizedName.Contains);
        var isRegulated = RegulatedTaxa.Any(normalizedName.Contains);
        var hasReportedEdibleParts = context.EdibleParts.Count > 0 && !isPotentiallyToxic;

        return new PlantSafetyAssessment(
            context.ScientificName,
            context.IdentificationConfidence,
            isPotentiallyToxic ? "potentially_toxic" : "unknown",
            isPotentiallyToxic
                ? "O nome identificado corresponde a um grupo com espécies potencialmente tóxicas. Evite contato ou ingestão e confirme com um especialista."
                : "A toxicidade não foi confirmada pelas informações disponíveis. Ausência de alerta não significa segurança.",
            hasReportedEdibleParts ? "reported_edible" : "unknown",
            hasReportedEdibleParts
                ? "A base de identificação relata partes com uso alimentar. Isso não confirma a identificação nem autoriza o consumo."
                : "Não há informação suficiente para avaliar comestibilidade. Não consuma com base apenas na foto.",
            context.EdibleParts,
            isRegulated ? "possibly_regulated" : "unknown",
            isRegulated
                ? "A espécie pode estar sujeita a restrições de cultivo, posse ou comércio no Brasil. Consulte a legislação e a autoridade competente."
                : "A situação regulatória não foi confirmada para a localização informada.",
            "plant_id+rules",
            DateTimeOffset.UtcNow,
            BuildSources(includeAi: false),
            Disclaimer);
    }

    private static PlantSafetyAssessment MergeWithDeterministicRules(
        PlantSafetyContext context,
        PlantSafetyAssessment fallback,
        GeminiSafetyResult ai)
    {
        var deterministicToxicity = fallback.ToxicityStatus == "potentially_toxic";
        var deterministicLegal = fallback.LegalStatus == "possibly_regulated";
        var deterministicEdibility = fallback.EdibilityStatus == "reported_edible";

        return fallback with
        {
            ToxicityStatus = deterministicToxicity
                ? fallback.ToxicityStatus
                : NormalizeStatus(ai.ToxicityStatus, ToxicityStatuses),
            ToxicityNote = deterministicToxicity
                ? fallback.ToxicityNote
                : NormalizeNote(ai.ToxicityNote, fallback.ToxicityNote),
            EdibilityStatus = deterministicEdibility
                ? fallback.EdibilityStatus
                : NormalizeStatus(ai.EdibilityStatus, EdibilityStatuses),
            EdibilityNote = deterministicEdibility
                ? fallback.EdibilityNote
                : NormalizeNote(ai.EdibilityNote, fallback.EdibilityNote),
            LegalStatus = deterministicLegal
                ? fallback.LegalStatus
                : NormalizeStatus(ai.LegalStatus, LegalStatuses),
            LegalNote = deterministicLegal
                ? fallback.LegalNote
                : NormalizeNote(ai.LegalNote, fallback.LegalNote),
            AssessmentOrigin = "plant_id+gemini+rules",
            AssessedAt = DateTimeOffset.UtcNow,
            Sources = BuildSources(includeAi: true),
            EdibleParts = context.EdibleParts
        };
    }

    private static IReadOnlyList<PlantSafetySource> BuildSources(bool includeAi)
    {
        var sources = new List<PlantSafetySource>
        {
            new("Plant.id — identificação e detalhes botânicos", "https://web.plant.id/", "identification"),
            new("Ibama — CITES e comércio exterior", "https://www.gov.br/ibama/pt-br/assuntos/biodiversidade/cites-e-comercio-exterior/convencao-sobre-comercio-internacional-das-especies-da-flora-e-fauna-selvagens-em-perigo-de-extincao-cites", "official_reference"),
            new("MMA/JBRJ — flora brasileira ameaçada", "https://ckan.jbrj.gov.br/pt_BR/dataset/portaria_443", "official_reference")
        };

        if (includeAi)
        {
            sources.Insert(1, new(
                "Gemini — análise complementar estruturada",
                "https://ai.google.dev/gemini-api/docs/structured-output",
                "ai_analysis"));
        }

        return sources;
    }

    private static object BuildResponseSchema() => new
    {
        type = "OBJECT",
        properties = new Dictionary<string, object>
        {
            ["toxicity_status"] = new
            {
                type = "STRING",
                @enum = new[] { "potentially_toxic", "no_evidence_found", "unknown" }
            },
            ["toxicity_note"] = new { type = "STRING" },
            ["edibility_status"] = new
            {
                type = "STRING",
                @enum = new[] { "reported_edible", "not_edible", "unknown" }
            },
            ["edibility_note"] = new { type = "STRING" },
            ["legal_status"] = new
            {
                type = "STRING",
                @enum = new[] { "possibly_regulated", "not_listed", "unknown" }
            },
            ["legal_note"] = new { type = "STRING" }
        },
        required = new[]
        {
            "toxicity_status", "toxicity_note", "edibility_status",
            "edibility_note", "legal_status", "legal_note"
        }
    };

    private static string BuildPrompt(PlantSafetyContext context)
    {
        var commonNames = context.CommonNames.Count > 0
            ? string.Join(", ", context.CommonNames.Take(5))
            : "não informados";
        var edibleParts = context.EdibleParts.Count > 0
            ? string.Join(", ", context.EdibleParts)
            : "não informadas";

        return $$"""
            Você auxilia um aplicativo brasileiro de identificação botânica. Avalie de modo conservador a planta:
            - nome científico identificado: {{context.ScientificName}}
            - família: {{context.Family ?? "não informada"}}
            - nomes comuns: {{commonNames}}
            - partes comestíveis relatadas pela base Plant.id: {{edibleParts}}

            Responda em português brasileiro e somente no JSON solicitado.
            Regras obrigatórias:
            1. Uma identificação por foto pode estar errada. Nunca afirme que é seguro ingerir ou manipular.
            2. "no_evidence_found" significa apenas que você não conhece alerta relevante; não significa "não tóxica".
            3. Use "reported_edible" apenas para uso alimentar amplamente documentado; ressalve preparo, parte correta e confirmação da espécie.
            4. Em legal_status, considere Brasil, CITES, conservação, cultivo, posse e comércio. Use "unknown" quando não houver certeza.
            5. Cada nota deve ser clara, ter no máximo 500 caracteres e explicar a incerteza.
            """;
    }

    private static string NormalizeStatus(string? value, HashSet<string> allowed) =>
        value is not null && allowed.Contains(value) ? value.ToLowerInvariant() : "unknown";

    private static string NormalizeNote(string? value, string fallback)
    {
        var note = value?.Trim();
        if (string.IsNullOrWhiteSpace(note)) return fallback;
        return note.Length <= 600 ? note : note[..600];
    }

    private static string Normalize(string value) => value.Trim().ToLowerInvariant();

    private sealed class GeminiSafetyResult
    {
        [JsonPropertyName("toxicity_status")]
        public string? ToxicityStatus { get; init; }

        [JsonPropertyName("toxicity_note")]
        public string? ToxicityNote { get; init; }

        [JsonPropertyName("edibility_status")]
        public string? EdibilityStatus { get; init; }

        [JsonPropertyName("edibility_note")]
        public string? EdibilityNote { get; init; }

        [JsonPropertyName("legal_status")]
        public string? LegalStatus { get; init; }

        [JsonPropertyName("legal_note")]
        public string? LegalNote { get; init; }
    }
}
