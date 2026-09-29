using Flashback.Migrations.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Flashback.Migrations;

public class FlashbackDbContextFactory
    : IDesignTimeDbContextFactory<FlashbackDbContext>
{
    public FlashbackDbContext CreateDbContext(string[] args)
    {
        var directory = new DirectoryInfo(
            Directory.GetCurrentDirectory());

        while (directory is not null &&
               !File.Exists(
                   Path.Combine(
                       directory.FullName,
                       "ProjectFlashback.slnx")))
        {
            directory = directory.Parent;
        }

        if (directory is null)
        {
            throw new InvalidOperationException(
                "Could not find ProjectFlashback.slnx.");
        }

        var databasePath = Path.Combine(
            directory.FullName,
            "src",
            "Flashback.Migrations",
            "flashback.db");

        var optionsBuilder =
            new DbContextOptionsBuilder<FlashbackDbContext>();

        optionsBuilder.UseSqlite(
            $"Data Source={databasePath}");

        return new FlashbackDbContext(
            optionsBuilder.Options);
    }
}