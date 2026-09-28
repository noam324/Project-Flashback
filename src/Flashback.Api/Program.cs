var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "ok",
        project = "Project Flashback",
        version = "0.1.0"
    });
});

app.MapGet("/api/version", () =>
{
    return Results.Ok(new
    {
        launcher = "0.1.0",
        api = "0.1.0",
        channel = "development"
    });
});

app.Run();