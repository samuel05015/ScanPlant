using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScanPlantAPI.Models;

public class Plant
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [ForeignKey("User")]
    public string? UserId { get; set; }

    [Required]
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

    // Imagens podem ser armazenadas como Base64
    public string? ImageData { get; set; }
    public string? ImageUrl { get; set; }

    // Geolocalização
    [Column(TypeName = "decimal(10, 7)")]
    public decimal? Latitude { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? Longitude { get; set; }

    [MaxLength(200)]
    public string? City { get; set; }

    [MaxLength(500)]
    public string? LocationName { get; set; }

    // Lembretes de rega
    public int? WateringFrequencyDays { get; set; }
    public string? WateringFrequencyText { get; set; }
    public bool ReminderEnabled { get; set; } = false;
    public string? ReminderNotificationId { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relacionamento
    public virtual ApplicationUser? User { get; set; }
}
