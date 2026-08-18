using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScanPlantAPI.Data;
using ScanPlantAPI.DTOs.Admin;
using ScanPlantAPI.Models;
using ScanPlantAPI.Services;

namespace ScanPlantAPI.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = AdminAccessService.AdminRole)]
public sealed class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<AdminOverviewDto>> GetOverview(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var recentRows = await _context.ModerationEvents
            .AsNoTracking()
            .Include(e => e.User)
            .OrderByDescending(e => e.CreatedAt)
            .Take(8)
            .ToListAsync(cancellationToken);

        var suspiciousUsers = await _context.ModerationEvents
            .AsNoTracking()
            .Where(e => e.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(e => e.UserId)
            .CountAsync(group => group.Count() >= 3, cancellationToken);

        return Ok(new AdminOverviewDto
        {
            TotalUsers = await _context.Users.CountAsync(cancellationToken),
            LockedUsers = await _context.Users.CountAsync(
                user => user.LockoutEnd.HasValue && user.LockoutEnd > now,
                cancellationToken),
            TotalMessages = await _context.Messages.CountAsync(cancellationToken),
            OpenAlerts = await _context.ModerationEvents.CountAsync(
                alert => alert.Status == "open",
                cancellationToken),
            CriticalAlerts = await _context.ModerationEvents.CountAsync(
                alert => alert.Status == "open" &&
                         (alert.Severity == "high" || alert.Severity == "critical"),
                cancellationToken),
            SuspiciousUsers = suspiciousUsers,
            RecentAlerts = recentRows.Select(MapAlert).ToList()
        });
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<List<AdminAlertDto>>> GetAlerts(
        [FromQuery] string status = "open",
        [FromQuery] string? severity = null,
        [FromQuery] string? source = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 200);
        var query = _context.ModerationEvents
            .AsNoTracking()
            .Include(e => e.User)
            .AsQueryable();

        if (!status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(e => e.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(severity))
        {
            query = query.Where(e => e.Severity == severity);
        }

        if (!string.IsNullOrWhiteSpace(source))
        {
            query = query.Where(e => e.Source == source);
        }

        var rows = await query
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return Ok(rows.Select(MapAlert).ToList());
    }

    [HttpPut("alerts/{id:guid}")]
    public async Task<IActionResult> ReviewAlert(
        Guid id,
        [FromBody] ReviewModerationEventDto dto,
        CancellationToken cancellationToken)
    {
        var alert = await _context.ModerationEvents.FindAsync([id], cancellationToken);
        if (alert is null)
        {
            return NotFound(new { message = "Alerta nao encontrado." });
        }

        alert.Status = dto.Status.ToLowerInvariant();
        alert.AdminNote = dto.Note?.Trim();
        alert.ReviewedAt = DateTime.UtcNow;
        alert.ReviewedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Alerta atualizado." });
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers(
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var usersQuery = _context.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            usersQuery = usersQuery.Where(user =>
                (user.Email != null && user.Email.ToLower().Contains(term)) ||
                (user.Name != null && user.Name.ToLower().Contains(term)));
        }

        var users = await usersQuery
            .OrderByDescending(user => user.CreatedAt)
            .Take(200)
            .Select(user => new
            {
                user.Id,
                Email = user.Email ?? string.Empty,
                Name = user.Name ?? user.Email ?? "Usuario",
                user.City,
                user.CreatedAt,
                user.LockoutEnd
            })
            .ToListAsync(cancellationToken);

        var userIds = users.Select(user => user.Id).ToArray();
        var messageStats = await _context.Messages
            .AsNoTracking()
            .Where(message => userIds.Contains(message.SenderId))
            .GroupBy(message => message.SenderId)
            .Select(group => new
            {
                UserId = group.Key,
                Count = group.Count(),
                LastAt = group.Max(message => (DateTime?)message.CreatedAt)
            })
            .ToDictionaryAsync(row => row.UserId, cancellationToken);

        var alertStats = await _context.ModerationEvents
            .AsNoTracking()
            .Where(alert => userIds.Contains(alert.UserId))
            .GroupBy(alert => alert.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                Count = group.Count(),
                Open = group.Count(alert => alert.Status == "open"),
                High = group.Count(alert => alert.Severity == "high"),
                Critical = group.Count(alert => alert.Severity == "critical"),
                LastAt = group.Max(alert => (DateTime?)alert.CreatedAt)
            })
            .ToDictionaryAsync(row => row.UserId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var result = users.Select(user =>
        {
            messageStats.TryGetValue(user.Id, out var messages);
            alertStats.TryGetValue(user.Id, out var alerts);
            var riskScore = (alerts?.Open ?? 0) +
                            (alerts?.High ?? 0) * 2 +
                            (alerts?.Critical ?? 0) * 4;
            var lastActivity = new[] { messages?.LastAt, alerts?.LastAt }
                .Where(value => value.HasValue)
                .Max();

            return new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                City = user.City,
                CreatedAt = user.CreatedAt,
                LastActivityAt = lastActivity,
                IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd > now,
                MessageCount = messages?.Count ?? 0,
                AlertCount = alerts?.Count ?? 0,
                OpenAlertCount = alerts?.Open ?? 0,
                RiskScore = riskScore,
                RiskLevel = riskScore >= 10 ? "high" : riskScore >= 4 ? "medium" : "low"
            };
        })
        .OrderByDescending(user => user.RiskScore)
        .ThenByDescending(user => user.LastActivityAt)
        .ToList();

        return Ok(result);
    }

    [HttpPut("users/{id}/lock")]
    public async Task<IActionResult> SetUserLock(
        string id,
        [FromBody] AdminUserLockDto dto,
        CancellationToken cancellationToken)
    {
        var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == currentAdminId)
        {
            return BadRequest(new { message = "Voce nao pode bloquear a propria conta." });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "Usuario nao encontrado." });
        }

        if (await _userManager.IsInRoleAsync(user, AdminAccessService.AdminRole))
        {
            return BadRequest(new { message = "Administradores nao podem ser bloqueados por este painel." });
        }

        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(
            user,
            dto.Locked ? DateTimeOffset.UtcNow.AddHours(dto.Hours) : null);

        _context.ModerationEvents.Add(new ModerationEvent
        {
            UserId = user.Id,
            Source = "admin",
            Category = dto.Locked ? "account_locked" : "account_unlocked",
            Severity = "info",
            Action = "admin_action",
            Status = "reviewed",
            Content = dto.Locked
                ? $"Conta bloqueada por {dto.Hours} hora(s)."
                : "Conta desbloqueada.",
            Reason = "Acao administrativa manual.",
            ReviewedAt = DateTime.UtcNow,
            ReviewedByUserId = currentAdminId
        });
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = dto.Locked ? "Usuario bloqueado." : "Usuario desbloqueado." });
    }

    [HttpGet("messages")]
    public async Task<ActionResult<List<AdminMessageDto>>> GetMessages(
        [FromQuery] string? userId = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 200);
        var query = _context.Messages.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(message => message.SenderId == userId);
        }

        var messages = await query
            .OrderByDescending(message => message.CreatedAt)
            .Take(limit)
            .Select(message => new AdminMessageDto
            {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                SenderName = message.Sender.Name ?? message.Sender.Email ?? "Usuario",
                SenderEmail = message.Sender.Email ?? string.Empty,
                Content = message.Content,
                CreatedAt = message.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(messages);
    }

    private static AdminAlertDto MapAlert(ModerationEvent alert) => new()
    {
        Id = alert.Id,
        UserId = alert.UserId,
        UserName = alert.User.Name ?? alert.User.Email ?? "Usuario",
        UserEmail = alert.User.Email ?? string.Empty,
        Source = alert.Source,
        Category = alert.Category,
        Severity = alert.Severity,
        Action = alert.Action,
        Status = alert.Status,
        Content = alert.Content,
        Reason = alert.Reason,
        ChatId = alert.ChatId,
        CreatedAt = alert.CreatedAt,
        ReviewedAt = alert.ReviewedAt,
        AdminNote = alert.AdminNote
    };
}
