using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScanPlantAPI.Models;

public class Message
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [ForeignKey("Chat")]
    public Guid ChatId { get; set; }

    [Required]
    [ForeignKey("Sender")]
    public string SenderId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public bool Read { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relacionamentos
    public virtual Chat Chat { get; set; } = null!;
    public virtual ApplicationUser Sender { get; set; } = null!;
}
