using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ScanPlantAPI.Services;

public interface IContentSafetyService
{
    ContentSafetyResult EvaluateCommunityMessage(string content);
    AssistantSafetyCategory ClassifyAssistantQuestion(string content);
    string Normalize(string content);
}

public sealed record ContentSafetyResult(
    bool Allowed,
    string? Message = null,
    string Category = "allowed",
    string Severity = "low");

public enum AssistantSafetyCategory
{
    Botanical,
    ControlledSubstance,
    Abuse,
    DangerousIngestion,
    OffTopic
}

public sealed class ContentSafetyService : IContentSafetyService
{
    // Listas simples e explicaveis para a demonstracao. Em producao, devem ser
    // complementadas por moderacao mais robusta, auditoria e processo de recurso.
    private static readonly string[] OffensiveTerms =
    [
        "idiota", "imbecil", "otario", "burro", "fdp", "vai se ferrar",
        "porra", "caralho", "merda", "racista", "nazista"
    ];

    private static readonly string[] ControlledPlants =
    [
        "maconha", "cannabis", "coca", "erythroxylum coca", "papoula do opio",
        "papaver somniferum", "opio", "ayahuasca"
    ];

    private static readonly string[] OperationalDrugTerms =
    [
        "cultivar", "plantar escondido", "produzir", "extrair", "processar",
        "vender", "comprar", "traficar", "aumentar thc", "burlar", "ocultar"
    ];

    private static readonly string[] BotanicalTerms =
    [
        "planta", "folha", "flor", "raiz", "semente", "rega", "regar", "agua",
        "solo", "terra", "adubo", "fertilizante", "luz", "sol", "sombra", "praga",
        "fungo", "doenca", "toxic", "venen", "comest", "jardim", "vaso", "muda"
    ];

    public ContentSafetyResult EvaluateCommunityMessage(string content)
    {
        // Normalizar antes da comparacao reduz bypass por acentos, caixa e espacos extras.
        var normalized = Normalize(content);
        if (OffensiveTerms.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase)))
        {
            return new(
                false,
                "Sua mensagem contém linguagem ofensiva. Reformule com respeito.",
                "abuse",
                "high");
        }

        if (ControlledPlants.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase))
            && OperationalDrugTerms.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase)))
        {
            return new(
                false,
                "Não é permitido negociar ou ensinar a produzir substâncias controladas.",
                "controlled_substance",
                "critical");
        }

        return new(true);
    }

    public AssistantSafetyCategory ClassifyAssistantQuestion(string content)
    {
        var normalized = Normalize(content);

        if (OffensiveTerms.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase)))
        {
            return AssistantSafetyCategory.Abuse;
        }

        if (ControlledPlants.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase)))
        {
            return AssistantSafetyCategory.ControlledSubstance;
        }

        if (new[] { "comer", "ingerir", "veneno", "envenen", "intoxic", "animal comeu", "crianca comeu" }
            .Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase)))
        {
            return AssistantSafetyCategory.DangerousIngestion;
        }

        return BotanicalTerms.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase))
            ? AssistantSafetyCategory.Botanical
            : AssistantSafetyCategory.OffTopic;
    }

    public string Normalize(string content)
    {
        // Remove marcas diacriticas: "toxico" com ou sem acento passa pela mesma regra.
        var decomposed = content.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return Regex.Replace(builder.ToString().Normalize(NormalizationForm.FormC), @"\s+", " ");
    }
}
