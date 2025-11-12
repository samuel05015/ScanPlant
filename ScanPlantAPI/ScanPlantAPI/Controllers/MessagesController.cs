using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScanPlantAPI.Data;
using ScanPlantAPI.DTOs.Messages;
using ScanPlantAPI.Models;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MessagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Enviar mensagem
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<MessageDto>> SendMessage([FromBody] CreateMessageDto dto)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var chat = await _context.Chats.FindAsync(dto.ChatId);
        if (chat == null)
        {
            return NotFound(new { message = "Chat não encontrado" });
        }

        var message = new Message
        {
            ChatId = dto.ChatId,
            SenderId = currentUserId,
            Content = dto.Content,
            Read = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        // Atualizar última mensagem do chat
        chat.LastMessage = dto.Content;
        chat.LastMessageTime = DateTime.UtcNow;
        chat.LastSenderId = currentUserId;
        chat.UnreadCount++;

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMessageById), new { id = message.Id }, MapToDto(message));
    }

    /// <summary>
    /// Obter mensagem por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageDto>> GetMessageById(Guid id)
    {
        var message = await _context.Messages.FindAsync(id);
        if (message == null)
        {
            return NotFound(new { message = "Mensagem não encontrada" });
        }

        return Ok(MapToDto(message));
    }

    /// <summary>
    /// Listar mensagens de um chat
    /// </summary>
    [HttpGet("chat/{chatId}")]
    [ProducesResponseType(typeof(List<MessageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MessageDto>>> GetChatMessages(Guid chatId)
    {
        var messages = await _context.Messages
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var messageDtos = messages.Select(MapToDto).ToList();
        return Ok(messageDtos);
    }

    /// <summary>
    /// Marcar mensagem como lida
    /// </summary>
    [HttpPut("{id}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkMessageAsRead(Guid id)
    {
        var message = await _context.Messages.FindAsync(id);
        if (message == null)
        {
            return NotFound(new { message = "Mensagem não encontrada" });
        }

        message.Read = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Mensagem marcada como lida" });
    }

    /// <summary>
    /// Contar mensagens não lidas
    /// </summary>
    [HttpGet("unread/count")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetUnreadCount()
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var unreadCount = await _context.Messages
            .Where(m => m.SenderId != currentUserId && !m.Read)
            .CountAsync();

        return Ok(new { count = unreadCount });
    }

    private static MessageDto MapToDto(Message message)
    {
        return new MessageDto
        {
            Id = message.Id,
            ChatId = message.ChatId,
            SenderId = message.SenderId,
            Content = message.Content,
            Read = message.Read,
            CreatedAt = message.CreatedAt
        };
    }
}
