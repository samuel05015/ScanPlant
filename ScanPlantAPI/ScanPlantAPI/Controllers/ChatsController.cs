using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ScanPlantAPI.Data;
using ScanPlantAPI.DTOs.Chats;
using ScanPlantAPI.Models;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ChatsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Criar novo chat ou retornar existente
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ChatDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ChatDto>> CreateChat([FromBody] CreateChatDto dto)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        // Verificar se já existe chat entre os usuários
        var existingChat = await _context.Chats
            .Include(c => c.Participants)
            .Where(c => c.ParticipantIds.Contains(currentUserId) && c.ParticipantIds.Contains(dto.OtherUserId))
            .FirstOrDefaultAsync();

        if (existingChat != null)
        {
            return Ok(await MapToDtoAsync(existingChat, currentUserId));
        }

        // Criar novo chat
        var participantIds = new List<string> { currentUserId, dto.OtherUserId };
        var chat = new Chat
        {
            ParticipantIds = JsonSerializer.Serialize(participantIds),
            CreatedAt = DateTime.UtcNow
        };

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync();

        // Adicionar participantes
        var chatParticipants = participantIds.Select(userId => new ChatParticipant
        {
            ChatId = chat.Id,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        }).ToList();

        _context.ChatParticipants.AddRange(chatParticipants);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChatById), new { id = chat.Id }, await MapToDtoAsync(chat, currentUserId));
    }

    /// <summary>
    /// Obter chat por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ChatDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChatDto>> GetChatById(Guid id)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var chat = await _context.Chats.Include(c => c.Participants).FirstOrDefaultAsync(c => c.Id == id);

        if (chat == null)
        {
            return NotFound(new { message = "Chat não encontrado" });
        }

        // Verificar se o usuário é participante
        var participantIds = JsonSerializer.Deserialize<List<string>>(chat.ParticipantIds) ?? new List<string>();
        if (!participantIds.Contains(currentUserId))
        {
            return Forbid();
        }

        return Ok(await MapToDtoAsync(chat, currentUserId!));
    }

    /// <summary>
    /// Listar chats do usuário
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ChatDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ChatDto>>> GetMyChats()
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var chats = await _context.Chats
            .Include(c => c.Participants)
            .Where(c => c.ParticipantIds.Contains(currentUserId!))
            .OrderByDescending(c => c.LastMessageTime ?? c.CreatedAt)
            .ToListAsync();

        var chatDtos = new List<ChatDto>();
        foreach (var chat in chats)
        {
            chatDtos.Add(await MapToDtoAsync(chat, currentUserId!));
        }

        return Ok(chatDtos);
    }

    /// <summary>
    /// Marcar mensagens como lidas
    /// </summary>
    [HttpPut("{id}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var chat = await _context.Chats.FindAsync(id);

        if (chat == null)
        {
            return NotFound(new { message = "Chat não encontrado" });
        }

        // Marcar mensagens como lidas
        var messages = await _context.Messages
            .Where(m => m.ChatId == id && m.SenderId != currentUserId && !m.Read)
            .ToListAsync();

        foreach (var message in messages)
        {
            message.Read = true;
        }

        chat.UnreadCount = 0;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Mensagens marcadas como lidas" });
    }

    private async Task<ChatDto> MapToDtoAsync(Chat chat, string currentUserId)
    {
        var participantIds = JsonSerializer.Deserialize<List<string>>(chat.ParticipantIds) ?? new List<string>();
        var otherUserId = participantIds.FirstOrDefault(id => id != currentUserId);

        ChatParticipantDto? otherParticipant = null;
        if (!string.IsNullOrEmpty(otherUserId))
        {
            var user = await _context.Users.FindAsync(otherUserId);
            if (user != null)
            {
                otherParticipant = new ChatParticipantDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    AvatarUrl = user.AvatarUrl
                };
            }
        }

        return new ChatDto
        {
            Id = chat.Id,
            ParticipantIds = participantIds,
            LastMessage = chat.LastMessage,
            LastMessageTime = chat.LastMessageTime,
            LastSenderId = chat.LastSenderId,
            UnreadCount = chat.UnreadCount,
            CreatedAt = chat.CreatedAt,
            OtherParticipant = otherParticipant
        };
    }
}
