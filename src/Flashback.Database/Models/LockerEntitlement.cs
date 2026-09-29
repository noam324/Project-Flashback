namespace Flashback.Database.Models;

public class LockerEntitlement
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AccountId { get; set; }

    public string ItemKey { get; set; } = string.Empty;

    public string ItemName { get; set; } = string.Empty;

    public string Category { get; set; } = "Cosmetic";

    public DateTime GrantedAtUtc { get; set; } = DateTime.UtcNow;

    public Account? Account { get; set; }
}
