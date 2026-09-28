namespace Flashback.Api.Models;

public class PlayerProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AccountId { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public int Level { get; set; } = 1;

    public int FlashbackCredits { get; set; } = 0;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Account? Account { get; set; }
}