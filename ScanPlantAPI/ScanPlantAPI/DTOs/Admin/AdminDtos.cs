using System.ComponentModel.DataAnnotations;

namespace ScanPlantAPI.DTOs.Admin;

public sealed class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int LockedUsers { get; set; }
    public int TotalMessages { get; set; }
    public int OpenAlerts { get; set; }
    public int CriticalAlerts { get; set; }
    public int SuspiciousUsers { get; set; }
    public List<AdminAlertDto> RecentAlerts { get; set; } = [];
}

public sealed class AdminAlertDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public Guid? ChatId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? AdminNote { get; set; }
}

public sealed class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? City { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public bool IsLocked { get; set; }
    public int MessageCount { get; set; }
    public int AlertCount { get; set; }
    public int OpenAlertCount { get; set; }
    public int RiskScore { get; set; }
    public string RiskLevel { get; set; } = "low";
}

public sealed class AdminMessageDto
{
    public Guid Id { get; set; }
    public Guid ChatId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public sealed class ReviewModerationEventDto
{
    [Required]
    [RegularExpression("^(reviewed|dismissed|escalated)$")]
    public string Status { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Note { get; set; }
}

public sealed class AdminUserLockDto
{
    public bool Locked { get; set; }

    [Range(1, 720)]
    public int Hours { get; set; } = 24;
}
