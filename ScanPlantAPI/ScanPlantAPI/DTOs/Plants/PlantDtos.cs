using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.DTOs.Plants;

public class CreatePlantDto
{
    [Required(ErrorMessage = "Nome científico é obrigatório")]
    [MaxLength(500)]
    public string ScientificName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? CommonName { get; set; }

    [MaxLength(500)]
    public string? Family { get; set; }

    [MaxLength(500)]
    public string? Genus { get; set; }

    public string? WikiDescription { get; set; }
    public string? CareInstructions { get; set; }
    [MaxLength(40)]
    public string? ToxicityStatus { get; set; }
    [MaxLength(1200)]
    public string? ToxicityNote { get; set; }
    [MaxLength(40)]
    public string? EdibilityStatus { get; set; }
    [MaxLength(1200)]
    public string? EdibilityNote { get; set; }
    public List<string>? EdibleParts { get; set; }
    [MaxLength(40)]
    public string? LegalStatus { get; set; }
    [MaxLength(1200)]
    public string? LegalNote { get; set; }
    [MaxLength(80)]
    public string? SafetyAssessmentOrigin { get; set; }
    public DateTimeOffset? SafetyAssessedAt { get; set; }
    public List<SafetySourceDto>? SafetySources { get; set; }
    [MaxLength(1200)]
    public string? SafetyDisclaimer { get; set; }
    public string? ImageData { get; set; }
    public string? ImageUrl { get; set; }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    [MaxLength(200)]
    public string? City { get; set; }

    [MaxLength(500)]
    public string? LocationName { get; set; }

    public int? WateringFrequencyDays { get; set; }
    public string? WateringFrequencyText { get; set; }
    public bool ReminderEnabled { get; set; } = false;
    public string? ReminderNotificationId { get; set; }
    public string? Notes { get; set; }
    public bool IsLocationPublic { get; set; } = false;
    public bool IsInCommunity { get; set; } = false;
}

public class UpdatePlantDto
{
    [MaxLength(500)]
    public string? ScientificName { get; set; }

    [MaxLength(500)]
    public string? CommonName { get; set; }

    [MaxLength(500)]
    public string? Family { get; set; }

    [MaxLength(500)]
    public string? Genus { get; set; }

    public string? WikiDescription { get; set; }
    public string? CareInstructions { get; set; }
    [MaxLength(40)]
    public string? ToxicityStatus { get; set; }
    [MaxLength(1200)]
    public string? ToxicityNote { get; set; }
    [MaxLength(40)]
    public string? EdibilityStatus { get; set; }
    [MaxLength(1200)]
    public string? EdibilityNote { get; set; }
    public List<string>? EdibleParts { get; set; }
    [MaxLength(40)]
    public string? LegalStatus { get; set; }
    [MaxLength(1200)]
    public string? LegalNote { get; set; }
    [MaxLength(80)]
    public string? SafetyAssessmentOrigin { get; set; }
    public DateTimeOffset? SafetyAssessedAt { get; set; }
    public List<SafetySourceDto>? SafetySources { get; set; }
    [MaxLength(1200)]
    public string? SafetyDisclaimer { get; set; }
    public string? ImageData { get; set; }
    public string? ImageUrl { get; set; }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    [MaxLength(200)]
    public string? City { get; set; }

    [MaxLength(500)]
    public string? LocationName { get; set; }

    public int? WateringFrequencyDays { get; set; }
    public string? WateringFrequencyText { get; set; }
    public bool? ReminderEnabled { get; set; }
    public string? ReminderNotificationId { get; set; }
    public string? Notes { get; set; }
    public bool? IsLocationPublic { get; set; }
    public bool? IsInCommunity { get; set; }
}

public class PlantDto
{
    public Guid Id { get; set; }
    public string? UserId { get; set; }
    public string ScientificName { get; set; } = string.Empty;
    public string? CommonName { get; set; }
    public string? Family { get; set; }
    public string? Genus { get; set; }
    public string? WikiDescription { get; set; }
    public string? CareInstructions { get; set; }
    public string? ToxicityStatus { get; set; }
    public string? ToxicityNote { get; set; }
    public string? EdibilityStatus { get; set; }
    public string? EdibilityNote { get; set; }
    public List<string>? EdibleParts { get; set; }
    public string? LegalStatus { get; set; }
    public string? LegalNote { get; set; }
    public string? SafetyAssessmentOrigin { get; set; }
    public DateTimeOffset? SafetyAssessedAt { get; set; }
    public List<SafetySourceDto>? SafetySources { get; set; }
    public string? SafetyDisclaimer { get; set; }
    public string? ImageData { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? City { get; set; }
    public string? LocationName { get; set; }
    public int? WateringFrequencyDays { get; set; }
    public string? WateringFrequencyText { get; set; }
    public bool ReminderEnabled { get; set; }
    public string? ReminderNotificationId { get; set; }
    public string? Notes { get; set; }
    public bool IsLocationPublic { get; set; }
    public bool IsInCommunity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SafetySourceDto
{
    [Required]
    [MaxLength(200)]
    public string Label { get; set; } = string.Empty;

    [Required]
    [Url]
    [MaxLength(1000)]
    public string Url { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Kind { get; set; } = string.Empty;
}
