using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScanPlantAPI.Models;

public class ModerationEvent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string Source { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Category { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Severity { get; set; } = "low";

    [Required, MaxLength(30)]
    public string Action { get; set; } = "flagged";

    [Required, MaxLength(30)]
    public string Status { get; set; } = "open";

    [Required, MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Reason { get; set; }

    public Guid? ChatId { get; set; }
    public Guid? MessageId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    [MaxLength(450)]
    public string? ReviewedByUserId { get; set; }

    [MaxLength(1000)]
    public string? AdminNote { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
}
