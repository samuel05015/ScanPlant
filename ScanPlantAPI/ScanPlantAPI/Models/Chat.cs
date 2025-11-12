using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.Models;

public class Chat
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // Array de IDs dos participantes (armazenado como JSON)
    [Required]
    public string ParticipantIds { get; set; } = "[]";

    public string? LastMessage { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public string? LastSenderId { get; set; }
    public int UnreadCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relacionamentos
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    public virtual ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
}
