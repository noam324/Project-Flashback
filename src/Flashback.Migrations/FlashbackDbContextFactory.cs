using Flashback.Migrations.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Flashback.Migrations;

public class FlashbackDbContextFactory : IDesignTimeDbContextFactory<FlashbackDbContext>
{
    public FlashbackDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FlashbackDbContext>();

        optionsBuilder.UseSqlite("Data Source=flashback.db");

        return new FlashbackDbContext(optionsBuilder.Options);
    }
}