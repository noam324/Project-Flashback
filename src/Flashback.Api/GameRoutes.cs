using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Flashback.Api;

public static class GameRoutes
{
    private const string BuildVersion = "12.50";
    private const string Changelist = "13137020";

    private static string FindBuild()
    {
        string executablePath = Path.Combine(
            "/mnt/c/Users/nlwy9/AppData/Local/ProjectFlashback/Builds",
            $"{BuildVersion}-CL-{Changelist}",
            "FortniteGame",
            "Binaries",
            "Win64",
            "FortniteClient-Win64-Shipping.exe"
        );

        return File.Exists(executablePath)
            ? executablePath
            : string.Empty;
    }

    public static void MapGameRoutes(WebApplication app)
    {
        app.MapGet("/api/game/status", () =>
        {
            var executablePath = FindBuild();

            return Results.Ok(new
            {
                installed = !string.IsNullOrWhiteSpace(executablePath),
                build = BuildVersion,
                changelist = Changelist,
                executablePath =
                    string.IsNullOrWhiteSpace(executablePath)
                        ? null
                        : executablePath
            });
        });

        app.MapPost("/api/game/launch", () =>
        {
            var executablePath = FindBuild();

            if (string.IsNullOrWhiteSpace(executablePath))
            {
                return Results.NotFound(new
                {
                    error = "Game build was not found."
                });
            }

            return Results.Ok(new
            {
                success = true,
                message = "Game build found.",
                executablePath
            });
        });
    }
}
