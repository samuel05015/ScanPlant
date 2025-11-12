using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.DTOs.Chats;

public class CreateChatDto
{
    [Required(ErrorMessage = "ID do outro usuário é obrigatório")]
    public string OtherUserId { get; set; } = string.Empty;
}

public class ChatDto
{
    public Guid Id { get; set; }
    public List<string> ParticipantIds { get; set; } = new();
    public string? LastMessage { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public string? LastSenderId { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public ChatParticipantDto? OtherParticipant { get; set; }
}

public class ChatParticipantDto
{
    public string Id { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
}
