namespace Flashback.Api;

public class PendingDiscordLogin
{
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? AccountId { get; set; }

    public string? DiscordUserId { get; set; }

    public string? SessionToken { get; set; }

    public bool Completed { get; set; }
}