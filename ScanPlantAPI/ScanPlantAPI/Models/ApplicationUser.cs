using Microsoft.AspNetCore.Identity;

namespace ScanPlantAPI.Models;

public class ApplicationUser : IdentityUser
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? ExperienceLevel { get; set; } // 'iniciante', 'intermediário', 'avançado'
    public string? PlantPreference { get; set; } // 'suculentas', 'tropicais', 'ornamentais', 'hortaliças'
    public string? City { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relacionamentos
    public virtual ICollection<Plant> Plants { get; set; } = new List<Plant>();
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    public virtual ICollection<ChatParticipant> ChatParticipants { get; set; } = new List<ChatParticipant>();
}
