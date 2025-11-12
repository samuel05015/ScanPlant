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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
