using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.DTOs.Messages;

public class CreateMessageDto
{
    [Required(ErrorMessage = "ID do chat é obrigatório")]
    public Guid ChatId { get; set; }

    [Required(ErrorMessage = "Conteúdo da mensagem é obrigatório")]
    [StringLength(5000, ErrorMessage = "A mensagem não pode ter mais de 5000 caracteres")]
    public string Content { get; set; } = string.Empty;
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ChatId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MarkAsReadDto
{
    [Required]
    public Guid MessageId { get; set; }
}
