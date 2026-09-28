namespace Flashback.Database.Models;

public class Account
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string DiscordUserId { get; set; } = string.Empty;

    public string DiscordUsername { get; set; } = string.Empty;

    public string? DiscordAvatarUrl { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public PlayerProfile? Profile { get; set; }
}
