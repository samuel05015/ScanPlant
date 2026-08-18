using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ScanPlantAPI.Data;
using ScanPlantAPI.DTOs.Plants;
using ScanPlantAPI.Models;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PlantsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Criar nova planta
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PlantDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PlantDto>> CreatePlant([FromBody] CreatePlantDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var plant = new Plant
        {
            UserId = userId,
            ScientificName = dto.ScientificName,
            CommonName = dto.CommonName,
            Family = dto.Family,
            Genus = dto.Genus,
            WikiDescription = dto.WikiDescription,
            CareInstructions = dto.CareInstructions,
            ToxicityStatus = dto.ToxicityStatus,
            ToxicityNote = dto.ToxicityNote,
            EdibilityStatus = dto.EdibilityStatus,
            EdibilityNote = dto.EdibilityNote,
            EdiblePartsJson = SerializeJson(dto.EdibleParts),
            LegalStatus = dto.LegalStatus,
            LegalNote = dto.LegalNote,
            SafetyAssessmentOrigin = dto.SafetyAssessmentOrigin,
            SafetyAssessedAt = dto.SafetyAssessedAt,
            SafetySourcesJson = SerializeJson(dto.SafetySources),
            SafetyDisclaimer = dto.SafetyDisclaimer,
            ImageData = dto.ImageData,
            ImageUrl = dto.ImageUrl,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            City = dto.City,
            LocationName = dto.LocationName,
            WateringFrequencyDays = dto.WateringFrequencyDays,
            WateringFrequencyText = dto.WateringFrequencyText,
            ReminderEnabled = dto.ReminderEnabled,
            ReminderNotificationId = dto.ReminderNotificationId,
            Notes = dto.Notes,
            IsLocationPublic = dto.IsLocationPublic,
            IsInCommunity = dto.IsInCommunity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Plants.Add(plant);
        await _context.SaveChangesAsync();

        var plantDto = MapToDto(plant);

        return CreatedAtAction(nameof(GetPlantById), new { id = plant.Id }, plantDto);
    }

    /// <summary>
    /// Obter planta por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PlantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlantDto>> GetPlantById(Guid id)
    {
        var plant = await _context.Plants.FindAsync(id);
        if (plant == null)
        {
            return NotFound(new { message = "Planta não encontrada" });
        }

        return Ok(MapToDto(plant));
    }

    /// <summary>
    /// Listar plantas do usuário logado
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(List<PlantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlantDto>>> GetMyPlants()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var plants = await _context.Plants
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var plantDtos = plants.Select(MapToDto).ToList();
        return Ok(plantDtos);
    }

    /// <summary>
    /// Listar todas as plantas (comunidade)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PlantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlantDto>>> GetAllPlants(
        [FromQuery] string? city = null,
        [FromQuery] string? family = null,
        [FromQuery] bool? reminderEnabled = null)
    {
        var query = _context.Plants.AsQueryable();

        // Aplicar filtros
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(p => p.City != null && p.City.Contains(city));
        }

        if (!string.IsNullOrEmpty(family))
        {
            query = query.Where(p => p.Family != null && p.Family.Contains(family));
        }

        if (reminderEnabled.HasValue)
        {
            query = query.Where(p => p.ReminderEnabled == reminderEnabled.Value);
        }

        // Por padrão retorna apenas plantas da comunidade
        query = query.Where(p => p.IsInCommunity);

        var plants = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var plantDtos = plants.Select(MapToDto).ToList();
        return Ok(plantDtos);
    }

    /// <summary>
    /// Listar plantas de um usuário específico
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(List<PlantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlantDto>>> GetUserPlants(string userId)
    {
        var plants = await _context.Plants
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var plantDtos = plants.Select(MapToDto).ToList();
        return Ok(plantDtos);
    }

    /// <summary>
    /// Atualizar planta
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(PlantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PlantDto>> UpdatePlant(Guid id, [FromBody] UpdatePlantDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var plant = await _context.Plants.FindAsync(id);

        if (plant == null)
        {
            return NotFound(new { message = "Planta não encontrada" });
        }

        // Verificar se o usuário é o dono da planta
        if (plant.UserId != userId)
        {
            return Forbid();
        }

        // Atualizar campos
        if (dto.ScientificName != null) plant.ScientificName = dto.ScientificName;
        if (dto.CommonName != null) plant.CommonName = dto.CommonName;
        if (dto.Family != null) plant.Family = dto.Family;
        if (dto.Genus != null) plant.Genus = dto.Genus;
        if (dto.WikiDescription != null) plant.WikiDescription = dto.WikiDescription;
        if (dto.CareInstructions != null) plant.CareInstructions = dto.CareInstructions;
        if (dto.ToxicityStatus != null) plant.ToxicityStatus = dto.ToxicityStatus;
        if (dto.ToxicityNote != null) plant.ToxicityNote = dto.ToxicityNote;
        if (dto.EdibilityStatus != null) plant.EdibilityStatus = dto.EdibilityStatus;
        if (dto.EdibilityNote != null) plant.EdibilityNote = dto.EdibilityNote;
        if (dto.EdibleParts != null) plant.EdiblePartsJson = SerializeJson(dto.EdibleParts);
        if (dto.LegalStatus != null) plant.LegalStatus = dto.LegalStatus;
        if (dto.LegalNote != null) plant.LegalNote = dto.LegalNote;
        if (dto.SafetyAssessmentOrigin != null) plant.SafetyAssessmentOrigin = dto.SafetyAssessmentOrigin;
        if (dto.SafetyAssessedAt.HasValue) plant.SafetyAssessedAt = dto.SafetyAssessedAt;
        if (dto.SafetySources != null) plant.SafetySourcesJson = SerializeJson(dto.SafetySources);
        if (dto.SafetyDisclaimer != null) plant.SafetyDisclaimer = dto.SafetyDisclaimer;
        if (dto.ImageData != null) plant.ImageData = dto.ImageData;
        if (dto.ImageUrl != null) plant.ImageUrl = dto.ImageUrl;
        if (dto.Latitude.HasValue) plant.Latitude = dto.Latitude;
        if (dto.Longitude.HasValue) plant.Longitude = dto.Longitude;
        if (dto.City != null) plant.City = dto.City;
        if (dto.LocationName != null) plant.LocationName = dto.LocationName;
        if (dto.WateringFrequencyDays.HasValue) plant.WateringFrequencyDays = dto.WateringFrequencyDays;
        if (dto.WateringFrequencyText != null) plant.WateringFrequencyText = dto.WateringFrequencyText;
        if (dto.ReminderEnabled.HasValue) plant.ReminderEnabled = dto.ReminderEnabled.Value;
        if (dto.ReminderNotificationId != null) plant.ReminderNotificationId = dto.ReminderNotificationId;
        if (dto.Notes != null) plant.Notes = dto.Notes;
        if (dto.IsLocationPublic.HasValue) plant.IsLocationPublic = dto.IsLocationPublic.Value;
        if (dto.IsInCommunity.HasValue) plant.IsInCommunity = dto.IsInCommunity.Value;

        plant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(plant));
    }

    /// <summary>
    /// Deletar planta
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeletePlant(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var plant = await _context.Plants.FindAsync(id);

        if (plant == null)
        {
            return NotFound(new { message = "Planta não encontrada" });
        }

        // Verificar se o usuário é o dono da planta
        if (plant.UserId != userId)
        {
            return Forbid();
        }

        _context.Plants.Remove(plant);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Listar plantas sem dono (órfãs)
    /// </summary>
    [HttpGet("orphaned")]
    [ProducesResponseType(typeof(List<PlantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlantDto>>> GetOrphanedPlants()
    {
        var plants = await _context.Plants
            .Where(p => p.UserId == null)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var plantDtos = plants.Select(MapToDto).ToList();
        return Ok(plantDtos);
    }

    /// <summary>
    /// Transferir plantas sem dono para o usuário atual
    /// </summary>
    [HttpPost("transfer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> TransferOrphanedPlants()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var orphanedPlants = await _context.Plants
            .Where(p => p.UserId == null)
            .ToListAsync();

        if (orphanedPlants.Count == 0)
        {
            return Ok(new { message = "Não há plantas sem dono para transferir", count = 0 });
        }

        foreach (var plant in orphanedPlants)
        {
            plant.UserId = userId;
            plant.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"{orphanedPlants.Count} plantas transferidas com sucesso", count = orphanedPlants.Count });
    }

    private static PlantDto MapToDto(Plant plant)
    {
        return new PlantDto
        {
            Id = plant.Id,
            UserId = plant.UserId,
            ScientificName = plant.ScientificName,
            CommonName = plant.CommonName,
            Family = plant.Family,
            Genus = plant.Genus,
            WikiDescription = plant.WikiDescription,
            CareInstructions = plant.CareInstructions,
            ToxicityStatus = plant.ToxicityStatus,
            ToxicityNote = plant.ToxicityNote,
            EdibilityStatus = plant.EdibilityStatus,
            EdibilityNote = plant.EdibilityNote,
            EdibleParts = DeserializeJson<List<string>>(plant.EdiblePartsJson),
            LegalStatus = plant.LegalStatus,
            LegalNote = plant.LegalNote,
            SafetyAssessmentOrigin = plant.SafetyAssessmentOrigin,
            SafetyAssessedAt = plant.SafetyAssessedAt,
            SafetySources = DeserializeJson<List<SafetySourceDto>>(plant.SafetySourcesJson),
            SafetyDisclaimer = plant.SafetyDisclaimer,
            ImageData = plant.ImageData,
            ImageUrl = plant.ImageUrl,
            Latitude = plant.Latitude,
            Longitude = plant.Longitude,
            City = plant.City,
            LocationName = plant.LocationName,
            WateringFrequencyDays = plant.WateringFrequencyDays,
            WateringFrequencyText = plant.WateringFrequencyText,
            ReminderEnabled = plant.ReminderEnabled,
            ReminderNotificationId = plant.ReminderNotificationId,
            Notes = plant.Notes,
            IsLocationPublic = plant.IsLocationPublic,
            IsInCommunity = plant.IsInCommunity,
            CreatedAt = plant.CreatedAt,
            UpdatedAt = plant.UpdatedAt
        };
    }

    private static string? SerializeJson<T>(T? value) where T : class =>
        value is null ? null : JsonSerializer.Serialize(value);

    private static T? DeserializeJson<T>(string? value) where T : class
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        try
        {
            return JsonSerializer.Deserialize<T>(value);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
