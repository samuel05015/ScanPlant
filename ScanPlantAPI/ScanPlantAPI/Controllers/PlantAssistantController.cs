using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ScanPlantAPI.Services;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/plant-assistant")]
[Authorize]
[EnableRateLimiting("assistant")]
public class PlantAssistantController : ControllerBase
{
    private readonly IContentSafetyService _contentSafety;

    public PlantAssistantController(IContentSafetyService contentSafety)
    {
        _contentSafety = contentSafety;
    }

    [HttpPost]
    public ActionResult Ask([FromBody] PlantAssistantRequest request)
    {
        var question = request.Question.Trim();
        var category = _contentSafety.ClassifyAssistantQuestion(question);
        var normalized = _contentSafety.Normalize(question);

        var response = category switch
        {
            AssistantSafetyCategory.Abuse => new PlantAssistantResponse(
                "Vamos manter a conversa respeitosa. Posso ajudar com identificação, rega, luz, solo, pragas e segurança de plantas.",
                "respect"),
            AssistantSafetyCategory.ControlledSubstance => new PlantAssistantResponse(
                "Posso oferecer informações botânicas, riscos e orientação legal geral, mas não instruções para cultivar, processar, ocultar ou comercializar plantas e substâncias controladas. Consulte a legislação e autoridades da sua região.",
                "controlled", true),
            AssistantSafetyCategory.DangerousIngestion => new PlantAssistantResponse(
                "Não consuma nem provoque vômito com base em uma identificação por foto. Afaste a planta, guarde uma amostra ou foto e procure imediatamente um centro de toxicologia, veterinário ou serviço de emergência, conforme quem foi exposto.",
                "safety", true),
            AssistantSafetyCategory.OffTopic => new PlantAssistantResponse(
                "Eu sou focado em plantas. Posso ajudar com rega, iluminação, solo, pragas, identificação e cuidados seguros. Qual planta ou sintoma você quer entender?",
                "scope"),
            _ => BuildBotanicalResponse(normalized)
        };

        return Ok(response);
    }

    private static PlantAssistantResponse BuildBotanicalResponse(string question)
    {
        if (ContainsAny(question, "regar", "rega", "agua"))
        {
            return new("Observe o substrato antes de seguir um calendário fixo: regue quando a camada superior estiver seca e deixe o excesso escorrer. A frequência muda com espécie, vaso, clima e estação. Diga o nome da planta e como está o solo para eu orientar melhor.", "watering");
        }

        if (ContainsAny(question, "luz", "sol", "sombra"))
        {
            return new("Comece com luz indireta intensa e observe a planta por alguns dias. Folhas queimadas sugerem sol forte; crescimento alongado e pálido pode indicar pouca luz. Informe a espécie e a direção da janela para uma orientação mais precisa.", "light");
        }

        if (ContainsAny(question, "praga", "fungo", "doenca", "amarela", "murcha", "mancha"))
        {
            return new("Isole a planta das demais, observe frente e verso das folhas e evite aplicar produtos sem identificar a causa. Excesso de água, pouca luz e pragas podem gerar sintomas parecidos. Envie uma foto nítida e descreva há quanto tempo o problema começou.", "diagnosis", true);
        }

        if (ContainsAny(question, "solo", "terra", "adubo", "fertilizante"))
        {
            return new("O substrato precisa equilibrar retenção de umidade e drenagem. Evite adubar plantas estressadas ou recém-transplantadas e nunca ultrapasse a dose do fabricante. Diga a espécie e o tipo de vaso para ajustar a recomendação.", "soil");
        }

        return new("Posso ajudar, mas preciso de um pouco mais de contexto: qual é a espécie, onde ela fica, com que frequência recebe água e qual mudança você percebeu? Se puder, use a tela de identificação para enviar uma foto.", "clarify");
    }

    private static bool ContainsAny(string value, params string[] terms) =>
        terms.Any(term => value.Contains(term, StringComparison.OrdinalIgnoreCase));
}

public sealed class PlantAssistantRequest
{
    [Required]
    [StringLength(800, MinimumLength = 2)]
    public string Question { get; set; } = string.Empty;
}

public sealed record PlantAssistantResponse(string Message, string Category, bool SafetyNotice = false);
