using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

const string fileName = "Fortnite-12.50-CL-13137020.rar";

string filePath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
    "Downloads",
    "Project Flashback",
    fileName
);

app.MapGet("/health", () =>
{
    bool exists = File.Exists(filePath);

    return Results.Ok(new
    {
        status = "ok",
        fileExists = exists,
        fileName,
        filePath
    });
});

app.MapGet($"/{fileName}", (HttpContext context) =>
{
    if (!File.Exists(filePath))
    {
        return Results.NotFound(new
        {
            error = "Build archive was not found.",
            filePath
        });
    }

    return Results.File(
        filePath,
        contentType: "application/x-rar-compressed",
        fileDownloadName: fileName,
        enableRangeProcessing: true
    );
});

app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        service = "Project Flashback Download Server",
        status = "online",
        file = fileName
    });
});

app.Run("http://127.0.0.1:8080");
