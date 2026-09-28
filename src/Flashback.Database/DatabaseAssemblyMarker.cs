using Flashback.Core.Data;

namespace Flashback.Database;

public static class DatabaseAssemblyMarker
{
    public static Type DbContextType => typeof(FlashbackDbContext);
}
