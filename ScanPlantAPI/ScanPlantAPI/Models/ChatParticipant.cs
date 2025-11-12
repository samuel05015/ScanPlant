using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScanPlantAPI.Models;

public class ChatParticipant
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [ForeignKey("Chat")]
    public Guid ChatId { get; set; }

    [Required]
    [ForeignKey("User")]
    public string UserId { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Relacionamentos
    public virtual Chat Chat { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
}
