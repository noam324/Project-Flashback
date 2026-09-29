using Flashback.Migrations.Models;
using Microsoft.EntityFrameworkCore;

namespace Flashback.Migrations.Data;

public class FlashbackDbContext : DbContext
{
    public FlashbackDbContext(
        DbContextOptions<FlashbackDbContext> options)
        : base(options)
    {
    }

    public DbSet<Account> Accounts => Set<Account>();

    public DbSet<PlayerProfile> PlayerProfiles =>
        Set<PlayerProfile>();

    public DbSet<LoginSession> LoginSessions =>
        Set<LoginSession>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Username)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(320)
                .IsRequired();

            entity.Property(x => x.DiscordUserId)
                .HasMaxLength(64)
                .IsRequired();

            entity.Property(x => x.DiscordUsername)
                .HasMaxLength(64)
                .IsRequired();

            entity.Property(x => x.DiscordAvatarUrl)
                .HasMaxLength(512);

            entity.HasIndex(x => x.Username)
                .IsUnique();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.HasIndex(x => x.DiscordUserId)
                .IsUnique();

            entity.HasOne(x => x.Profile)
                .WithOne(x => x.Account)
                .HasForeignKey<PlayerProfile>(
                    x => x.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlayerProfile>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.DisplayName)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.FlashbackCredits)
                .HasDefaultValue(0);

            entity.Property(x => x.Level)
                .HasDefaultValue(1);
        });

        modelBuilder.Entity<LoginSession>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.TokenHash)
                .HasMaxLength(64)
                .IsRequired();

            entity.HasIndex(x => x.TokenHash)
                .IsUnique();

            entity.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}