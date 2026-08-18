using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using ScanPlantAPI.Data;
using ScanPlantAPI.DTOs.Messages;
using ScanPlantAPI.Models;
using ScanPlantAPI.Services;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IContentSafetyService _contentSafety;

    public MessagesController(ApplicationDbContext context, IContentSafetyService contentSafety)
    {
        _context = context;
        _contentSafety = contentSafety;
    }

    /// <summary>
    /// Enviar mensagem
    /// </summary>
    [HttpPost]
    // Protege disponibilidade e reduz spam por usuario/IP.
    [EnableRateLimiting("messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<MessageDto>> SendMessage([FromBody] CreateMessageDto dto)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var chat = await _context.Chats.FirstOrDefaultAsync(c => c.Id == dto.ChatId);
        if (chat == null)
        {
            return NotFound(new { message = "Chat não encontrado" });
        }

        // O remetente vem do JWT e precisa pertencer ao chat; nao confiamos em SenderId do body.
        if (!await IsParticipantAsync(dto.ChatId, currentUserId))
        {
            return Forbid();
        }

        var content = dto.Content.Trim();
        if (content.Length == 0)
        {
            return BadRequest(new { message = "A mensagem não pode estar vazia." });
        }

        // Moderacao e uma regra de seguranca de conteudo; ela complementa a
        // autenticacao, mas nao substitui a verificacao de participante acima.
        var moderation = _contentSafety.EvaluateCommunityMessage(content);
        if (!moderation.Allowed)
        {
            _context.ModerationEvents.Add(new ModerationEvent
            {
                UserId = currentUserId,
                Source = "chat",
                Category = moderation.Category,
                Severity = moderation.Severity,
                Action = "blocked",
                Status = "open",
                Content = content,
                Reason = moderation.Message,
                ChatId = dto.ChatId
            });
            await _context.SaveChangesAsync();
            return BadRequest(new { message = moderation.Message });
        }

        var message = new Message
        {
            ChatId = dto.ChatId,
            SenderId = currentUserId,
            Content = content,
            Read = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        // Atualizar última mensagem do chat
        chat.LastMessage = content;
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
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var message = await _context.Messages.FindAsync(id);
        if (message == null)
        {
            return NotFound(new { message = "Mensagem não encontrada" });
        }

        if (string.IsNullOrEmpty(currentUserId) || !await IsParticipantAsync(message.ChatId, currentUserId))
        {
            return Forbid();
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
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId) || !await IsParticipantAsync(chatId, currentUserId))
        {
            return Forbid();
        }

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
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var message = await _context.Messages.FindAsync(id);
        if (message == null)
        {
            return NotFound(new { message = "Mensagem não encontrada" });
        }

        if (string.IsNullOrEmpty(currentUserId) ||
            message.SenderId == currentUserId ||
            !await IsParticipantAsync(message.ChatId, currentUserId))
        {
            return Forbid();
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
            .Where(m => m.SenderId != currentUserId && !m.Read &&
                m.Chat.Participants.Any(p => p.UserId == currentUserId))
            .CountAsync();

        return Ok(new { count = unreadCount });
    }

    private Task<bool> IsParticipantAsync(Guid chatId, string userId) =>
        // Consulta parametrizada pelo EF Core: evita SQL montado manualmente.
        _context.ChatParticipants.AnyAsync(p => p.ChatId == chatId && p.UserId == userId);

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
