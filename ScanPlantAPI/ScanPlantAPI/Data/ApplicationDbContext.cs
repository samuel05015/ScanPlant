using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ScanPlantAPI.Models;

namespace ScanPlantAPI.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Plant> Plants { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatParticipant> ChatParticipants { get; set; }
    public DbSet<Message> Messages { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configurações adicionais dos relacionamentos
        builder.Entity<Plant>()
            .HasOne(p => p.User)
            .WithMany(u => u.Plants)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ChatParticipant>()
            .HasOne(cp => cp.Chat)
            .WithMany(c => c.Participants)
            .HasForeignKey(cp => cp.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ChatParticipant>()
            .HasOne(cp => cp.User)
            .WithMany(u => u.ChatParticipants)
            .HasForeignKey(cp => cp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Message>()
            .HasOne(m => m.Chat)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.Messages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices para melhor performance
        builder.Entity<Plant>()
            .HasIndex(p => p.UserId);

        builder.Entity<Plant>()
            .HasIndex(p => p.City);

        builder.Entity<ChatParticipant>()
            .HasIndex(cp => new { cp.ChatId, cp.UserId })
            .IsUnique();

        builder.Entity<Message>()
            .HasIndex(m => m.ChatId);

        builder.Entity<Message>()
            .HasIndex(m => m.CreatedAt);
    }
}
