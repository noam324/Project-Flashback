using Flashback.Core.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Flashback.Database;

public class FlashbackDbContextFactory : IDesignTimeDbContextFactory<FlashbackDbContext>
{
    public FlashbackDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FlashbackDbContext>();

        optionsBuilder.UseSqlite(
            "Data Source=flashback.db",
            sqliteOptions =>
                sqliteOptions.MigrationsAssembly(typeof(FlashbackDbContextFactory).Assembly.FullName));

        return new FlashbackDbContext(optionsBuilder.Options);
    }
}
