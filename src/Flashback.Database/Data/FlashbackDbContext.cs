using Flashback.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Flashback.Database.Data;

public class FlashbackDbContext : DbContext
{
    public FlashbackDbContext(DbContextOptions<FlashbackDbContext> options)
        : base(options)
    {
    }

    public DbSet<Account> Accounts => Set<Account>();

    public DbSet<PlayerProfile> PlayerProfiles => Set<PlayerProfile>();

    public DbSet<LoginSession> LoginSessions => Set<LoginSession>();

    public DbSet<LockerEntitlement> LockerEntitlements =>
        Set<LockerEntitlement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
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

            entity.HasIndex(x => x.Username)
                .IsUnique();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.HasIndex(x => x.DiscordUserId)
                .IsUnique();

            entity.HasOne(x => x.Profile)
                .WithOne(x => x.Account)
                .HasForeignKey<PlayerProfile>(x => x.AccountId)
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

        modelBuilder.Entity<LockerEntitlement>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ItemKey)
                .HasMaxLength(128)
                .IsRequired();

            entity.Property(x => x.ItemName)
                .HasMaxLength(128)
                .IsRequired();

            entity.Property(x => x.Category)
                .HasMaxLength(32)
                .IsRequired();

            entity.HasIndex(x => new { x.AccountId, x.ItemKey })
                .IsUnique();

            entity.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
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
