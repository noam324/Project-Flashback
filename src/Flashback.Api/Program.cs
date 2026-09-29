using System.Collections.Concurrent;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Flashback.Database.Data;
using Flashback.Database.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// SERVICES
// ============================================================

builder.Services.AddDbContext<FlashbackDbContext>(options =>
{
    var connectionString =
        builder.Configuration.GetConnectionString(
            "DefaultConnection");

    options.UseSqlite(connectionString);
});

builder.Services.AddHttpClient();

var app = builder.Build();

// ============================================================
// CONFIG
// ============================================================

const string ApiVersion = "0.1.0";

const string BuildVersion = "12.50";

const string BuildCL = "13137020";

const string BuildArchiveName =
    "Fortnite-12.50-CL-13137020.rar";

const string BuildSha256 =
    "A82048E0666D646C359952A2CB9CA3187AB53C6F687813BC6FB33088A3A46923";

const string BuildDownloadUrl =
    "http://localhost:8080/Fortnite-12.50-CL-13137020.rar";

const string DiscordTokenUrl =
    "https://discord.com/api/oauth2/token";

const string DiscordUserUrl =
    "https://discord.com/api/users/@me";

var discordClientId =
    builder.Configuration["Discord:ClientId"];

var discordClientSecret =
    builder.Configuration["Discord:ClientSecret"];

var discordRedirectUri =
    builder.Configuration["Discord:RedirectUri"];

if (string.IsNullOrWhiteSpace(discordClientId))
{
    throw new InvalidOperationException(
        "Discord:ClientId is missing.");
}

if (string.IsNullOrWhiteSpace(discordClientSecret))
{
    throw new InvalidOperationException(
        "Discord:ClientSecret is missing.");
}

if (string.IsNullOrWhiteSpace(discordRedirectUri))
{
    throw new InvalidOperationException(
        "Discord:RedirectUri is missing.");
}

// ============================================================
// DISCORD LOGIN STATE
// ============================================================

var pendingDiscordLogins =
    new ConcurrentDictionary<
        string,
        PendingDiscordLogin>();

// ============================================================
// HEALTH
// ============================================================

app.MapGet(
    "/api/health",
    () =>
    {
        return Results.Ok(
            new
            {
                status = "ok",
                version = ApiVersion
            });
    });

// ============================================================
// VERSION
// ============================================================

app.MapGet(
    "/api/version",
    (IHostEnvironment environment) =>
    {
        return Results.Ok(
            new
            {
                name = "launcher api",
                version = ApiVersion,
                build = BuildVersion,
                environment =
                    environment.EnvironmentName
            });
    });

// ============================================================
// BUILD INFORMATION
// ============================================================

app.MapGet(
    "/api/build/latest",
    () =>
    {
        return Results.Ok(
            new
            {
                version = BuildVersion,
                cl = BuildCL,
                archiveName =
                    BuildArchiveName,
                sha256 =
                    BuildSha256,
                downloadUrl =
                    BuildDownloadUrl
            });
    });

// ============================================================
// DISCORD LOGIN START
// ============================================================

app.MapGet(
    "/api/auth/discord/start",
    () =>
    {
        CleanupPendingLogins();

        var ticket =
            GenerateToken(32);

        pendingDiscordLogins[ticket] =
            new PendingDiscordLogin
            {
                Ticket = ticket,
                CreatedAtUtc =
                    DateTime.UtcNow
            };

        var authorizationUrl =
            "https://discord.com/oauth2/authorize" +
            $"?client_id={Uri.EscapeDataString(discordClientId)}" +
            "&response_type=code" +
            $"&redirect_uri={Uri.EscapeDataString(discordRedirectUri)}" +
            "&scope=identify" +
            $"&state={Uri.EscapeDataString(ticket)}";

        return Results.Ok(
            new
            {
                ticket,
                authorizationUrl
            });
    });

// ============================================================
// DISCORD CALLBACK
// ============================================================

app.MapGet(
    "/api/auth/discord/callback",
    async (
        string? code,
        string? state,
        IHttpClientFactory httpClientFactory,
        FlashbackDbContext db) =>
    {
        if (string.IsNullOrWhiteSpace(code) ||
            string.IsNullOrWhiteSpace(state))
        {
            return Results.Content(
                CreateHtmlPage(
                    "Project Flashback",
                    "Discord login failed.",
                    "Missing authorization code or state."),
                "text/html");
        }

        if (!pendingDiscordLogins.TryGetValue(
                state,
                out var pending))
        {
            return Results.Content(
                CreateHtmlPage(
                    "Project Flashback",
                    "Discord login failed.",
                    "The login session is invalid or expired."),
                "text/html");
        }

        if (DateTime.UtcNow -
                pending.CreatedAtUtc >
            TimeSpan.FromMinutes(10))
        {
            pendingDiscordLogins.TryRemove(
                state,
                out _);

            return Results.Content(
                CreateHtmlPage(
                    "Project Flashback",
                    "Discord login expired.",
                    "Please return to Project Flashback and try again."),
                "text/html");
        }

        try
        {
            var client =
                httpClientFactory.CreateClient();

            // ----------------------------------------------------
            // EXCHANGE CODE FOR DISCORD ACCESS TOKEN
            // ----------------------------------------------------

            using var tokenRequest =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    DiscordTokenUrl);

            var tokenForm =
                new Dictionary<string, string>
                {
                    ["client_id"] =
                        discordClientId,

                    ["client_secret"] =
                        discordClientSecret,

                    ["grant_type"] =
                        "authorization_code",

                    ["code"] =
                        code,

                    ["redirect_uri"] =
                        discordRedirectUri
                };

            tokenRequest.Content =
                new FormUrlEncodedContent(
                    tokenForm);

            using var tokenResponse =
                await client.SendAsync(
                    tokenRequest);

            if (!tokenResponse.IsSuccessStatusCode)
            {
                var errorBody =
                    await tokenResponse.Content
                        .ReadAsStringAsync();

                Console.WriteLine(
                    $"Discord token error: {errorBody}");

                pendingDiscordLogins.TryRemove(
                    state,
                    out _);

                return Results.Content(
                    CreateHtmlPage(
                        "Project Flashback",
                        "Discord authorization failed.",
                        $"Discord returned HTTP {(int)tokenResponse.StatusCode}."),
                    "text/html");
            }

            var tokenJson =
                await tokenResponse.Content
                    .ReadAsStringAsync();

            using var tokenDocument =
                JsonDocument.Parse(
                    tokenJson);

            if (!tokenDocument.RootElement.TryGetProperty(
                    "access_token",
                    out var accessTokenElement))
            {
                pendingDiscordLogins.TryRemove(
                    state,
                    out _);

                return Results.Content(
                    CreateHtmlPage(
                        "Project Flashback",
                        "Discord authorization failed.",
                        "Discord did not return an access token."),
                    "text/html");
            }

            var accessToken =
                accessTokenElement.GetString();

            if (string.IsNullOrWhiteSpace(accessToken))
            {
                pendingDiscordLogins.TryRemove(
                    state,
                    out _);

                return Results.Content(
                    CreateHtmlPage(
                        "Project Flashback",
                        "Discord authorization failed.",
                        "The Discord access token was empty."),
                    "text/html");
            }

            // ----------------------------------------------------
            // GET DISCORD USER
            // ----------------------------------------------------

            using var userRequest =
                new HttpRequestMessage(
                    HttpMethod.Get,
                    DiscordUserUrl);

            userRequest.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Bearer",
                    accessToken);

            using var userResponse =
                await client.SendAsync(
                    userRequest);

            if (!userResponse.IsSuccessStatusCode)
            {
                pendingDiscordLogins.TryRemove(
                    state,
                    out _);

                return Results.Content(
                    CreateHtmlPage(
                        "Project Flashback",
                        "Discord user lookup failed.",
                        $"Discord returned HTTP {(int)userResponse.StatusCode}."),
                    "text/html");
            }

            var userJson =
                await userResponse.Content
                    .ReadAsStringAsync();

            using var userDocument =
                JsonDocument.Parse(
                    userJson);

            var discordUser =
                userDocument.RootElement;

            var discordUserId =
                GetJsonString(
                    discordUser,
                    "id");

            var discordUsername =
                GetJsonString(
                    discordUser,
                    "username");

            var globalName =
                GetJsonString(
                    discordUser,
                    "global_name");

            var avatar =
                GetJsonString(
                    discordUser,
                    "avatar");

            if (string.IsNullOrWhiteSpace(discordUserId) ||
                string.IsNullOrWhiteSpace(discordUsername))
            {
                pendingDiscordLogins.TryRemove(
                    state,
                    out _);

                return Results.Content(
                    CreateHtmlPage(
                        "Project Flashback",
                        "Discord user data is invalid.",
                        "Discord did not return the required account information."),
                    "text/html");
            }

            // ----------------------------------------------------
            // FIND ACCOUNT
            // ----------------------------------------------------

            var account =
                await db.Accounts
                    .Include(x => x.Profile)
                    .SingleOrDefaultAsync(
                        x =>
                            x.DiscordUserId ==
                            discordUserId);

            // ----------------------------------------------------
            // CREATE ACCOUNT IF NECESSARY
            // ----------------------------------------------------

            if (account is null)
            {
                var requestedName =
                    !string.IsNullOrWhiteSpace(globalName)
                        ? globalName
                        : discordUsername;

                requestedName =
                    LimitString(
                        requestedName,
                        32);

                var username =
                    await CreateUniqueUsernameAsync(
                        db,
                        requestedName);

                account =
                    new Account
                    {
                        Id =
                            Guid.NewGuid(),

                        Username =
                            username,

                        Email =
                            $"discord-{discordUserId}@local.projectflashback",

                        DiscordUserId =
                            discordUserId,

                        DiscordUsername =
                            discordUsername,

                        DiscordAvatarUrl =
                            BuildDiscordAvatarUrl(
                                discordUserId,
                                avatar),

                        CreatedAtUtc =
                            DateTime.UtcNow
                    };

                account.Profile =
                    new PlayerProfile
                    {
                        Id =
                            Guid.NewGuid(),

                        AccountId =
                            account.Id,

                        DisplayName =
                            username,

                        Level = 1,

                        FlashbackCredits = 0,

                        CreatedAtUtc =
                            DateTime.UtcNow
                    };

                db.Accounts.Add(
                    account);
            }
            else
            {
                account.DiscordUsername =
                    discordUsername;

                account.DiscordAvatarUrl =
                    BuildDiscordAvatarUrl(
                        discordUserId,
                        avatar);

                if (account.Profile is null)
                {
                    account.Profile =
                        new PlayerProfile
                        {
                            Id =
                                Guid.NewGuid(),

                            AccountId =
                                account.Id,

                            DisplayName =
                                account.Username,

                            Level = 1,

                            FlashbackCredits = 0,

                            CreatedAtUtc =
                                DateTime.UtcNow
                        };
                }
            }

            await db.SaveChangesAsync();

            // ----------------------------------------------------
            // CREATE SERVER SESSION
            // ----------------------------------------------------

            var sessionToken =
                GenerateToken(32);

            var tokenHash =
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(
                        sessionToken));

            var tokenHashHex =
                Convert.ToHexString(
                    tokenHash);

            var session =
                new LoginSession
                {
                    Id =
                        Guid.NewGuid(),

                    AccountId =
                        account.Id,

                    TokenHash =
                        tokenHashHex,

                    CreatedAtUtc =
                        DateTime.UtcNow,

                    ExpiresAtUtc =
                        DateTime.UtcNow.AddDays(30)
                };

            db.LoginSessions.Add(
                session);

            await db.SaveChangesAsync();

            // ----------------------------------------------------
            // COMPLETE PENDING LOGIN
            // ----------------------------------------------------

            pending.SessionToken =
                sessionToken;

            pending.Account =
                CreateAccountResponse(
                    account);

            pending.Completed =
                true;

            return Results.Content(
                CreateHtmlPage(
                    "Project Flashback",
                    "Discord login successful.",
                    "You can close this window and return to Project Flashback."),
                "text/html");
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Discord callback exception: {ex}");

            pendingDiscordLogins.TryRemove(
                state,
                out _);

            return Results.Content(
                CreateHtmlPage(
                    "Project Flashback",
                    "Login failed.",
                    "An unexpected server error occurred."),
                "text/html");
        }
    });

// ============================================================
// DISCORD LOGIN STATUS
// ============================================================

app.MapGet(
    "/api/auth/discord/status/{ticket}",
    (string ticket) =>
    {
        CleanupPendingLogins();

        if (!pendingDiscordLogins.TryGetValue(
                ticket,
                out var pending))
        {
            return Results.NotFound(
                new
                {
                    status = "not_found"
                });
        }

        if (!pending.Completed)
        {
            return Results.Ok(
                new
                {
                    status = "pending"
                });
        }

        return Results.Ok(
            new
            {
                status = "complete",

                sessionToken =
                    pending.SessionToken,

                account =
                    pending.Account
            });
    });

// ============================================================
// SESSION VALIDATE
// ============================================================

app.MapGet(
    "/api/auth/session/validate",
    async (
        HttpRequest request,
        FlashbackDbContext db) =>
    {
        var token =
            GetBearerToken(request);

        if (string.IsNullOrWhiteSpace(token))
        {
            return Results.Unauthorized();
        }

        var tokenHash =
            Convert.ToHexString(
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(
                        token)));

        var session =
            await db.LoginSessions
                .Include(x => x.Account)
                .ThenInclude(x => x!.Profile)
                .SingleOrDefaultAsync(
                    x =>
                        x.TokenHash ==
                        tokenHash);

        if (session is null)
        {
            return Results.Unauthorized();
        }

        if (session.ExpiresAtUtc <=
            DateTime.UtcNow)
        {
            db.LoginSessions.Remove(
                session);

            await db.SaveChangesAsync();

            return Results.Unauthorized();
        }

        if (session.Account is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(
            new
            {
                account =
                    CreateAccountResponse(
                        session.Account)
            });
    });

// ============================================================
// SESSION LOGOUT
// ============================================================

app.MapPost(
    "/api/auth/session/logout",
    async (
        HttpRequest request,
        FlashbackDbContext db) =>
    {
        var token =
            GetBearerToken(request);

        if (string.IsNullOrWhiteSpace(token))
        {
            return Results.Ok(
                new
                {
                    status = "ok"
                });
        }

        var tokenHash =
            Convert.ToHexString(
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(
                        token)));

        var session =
            await db.LoginSessions
                .SingleOrDefaultAsync(
                    x =>
                        x.TokenHash ==
                        tokenHash);

        if (session is not null)
        {
            db.LoginSessions.Remove(
                session);

            await db.SaveChangesAsync();
        }

        return Results.Ok(
            new
            {
                status = "ok"
            });
    });

// ============================================================
// GAME LAUNCH
// ============================================================

app.MapPost(
    "/api/game/launch",
    (HttpRequest request) =>
    {
        if (!request.Headers.TryGetValue(
                "X-Flashback-Launcher",
                out var launcherHeader) ||
            launcherHeader != "true")
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden);
        }

        var localAppData =
            Environment.GetFolderPath(
                Environment.SpecialFolder.LocalApplicationData);

        var buildRoot =
            Path.Combine(
                localAppData,
                "ProjectFlashback",
                "Builds",
                $"{BuildVersion}-CL-{BuildCL}");

        if (!Directory.Exists(
                buildRoot))
        {
            return Results.NotFound(
                new
                {
                    error =
                        "Build directory not found."
                });
        }

        var expectedDirectory =
            Path.Combine(
                buildRoot,
                "FortniteGame",
                "Binaries",
                "Win64");

        var expectedExecutable =
            Path.Combine(
                expectedDirectory,
                "FortniteClient-Win64-Shipping.exe");

        if (!File.Exists(
                expectedExecutable))
        {
            return Results.NotFound(
                new
                {
                    error =
                        "Game executable not found."
                });
        }

        try
        {
            var process =
                Process.Start(
                    new ProcessStartInfo
                    {
                        FileName =
                            expectedExecutable,

                        WorkingDirectory =
                            expectedDirectory,

                        UseShellExecute =
                            true
                    });

            if (process is null)
            {
                return Results.Problem(
                    "Windows could not start the game.");
            }

            Console.WriteLine(
                $"Game launched. PID: {process.Id}");

            return Results.Ok(
                new
                {
                    status = "started",

                    processId =
                        process.Id
                });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Game launch error: {ex}");

            return Results.Problem(
                detail: ex.Message,
                title: "Game launch failed.");
        }
    });

// ============================================================
// DEVELOPMENT DATABASE COUNTS
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.MapGet(
        "/api/dev/db-counts",
        async (
            FlashbackDbContext db) =>
        {
            var accounts =
                await db.Accounts.CountAsync();

            var profiles =
                await db.PlayerProfiles.CountAsync();

            var sessions =
                await db.LoginSessions.CountAsync();

            return Results.Ok(
                new
                {
                    accounts,

                    profiles,

                    loginSessions =
                        sessions
                });
        });
}

// ============================================================
// STARTUP
// ============================================================

app.Lifetime.ApplicationStarted.Register(
    () =>
    {
        Console.WriteLine(
            "==========================================");

        Console.WriteLine(
            "PROJECT FLASHBACK API");

        Console.WriteLine(
            $"API Version: {ApiVersion}");

        Console.WriteLine(
            $"Build: {BuildVersion} CL {BuildCL}");

        Console.WriteLine(
            "API: http://localhost:5056");

        Console.WriteLine(
            "==========================================");
    });

// ============================================================
// LOCAL FUNCTIONS
// ============================================================

void CleanupPendingLogins()
{
    var now =
        DateTime.UtcNow;

    foreach (var item in pendingDiscordLogins)
    {
        if (now -
                item.Value.CreatedAtUtc >
            TimeSpan.FromMinutes(10))
        {
            pendingDiscordLogins.TryRemove(
                item.Key,
                out _);
        }
    }
}

static string GenerateToken(
    int byteCount)
{
    var bytes =
        RandomNumberGenerator.GetBytes(
            byteCount);

    return Convert
        .ToBase64String(bytes)
        .Replace("+", "-")
        .Replace("/", "_")
        .TrimEnd('=');
}

static string? GetBearerToken(
    HttpRequest request)
{
    if (!request.Headers.TryGetValue(
            "Authorization",
            out var values))
    {
        return null;
    }

    var value =
        values.FirstOrDefault();

    if (string.IsNullOrWhiteSpace(value))
    {
        return null;
    }

    const string prefix =
        "Bearer ";

    if (!value.StartsWith(
            prefix,
            StringComparison.OrdinalIgnoreCase))
    {
        return null;
    }

    var token =
        value[prefix.Length..].Trim();

    return string.IsNullOrWhiteSpace(token)
        ? null
        : token;
}

static string? GetJsonString(
    JsonElement element,
    string propertyName)
{
    if (!element.TryGetProperty(
            propertyName,
            out var property))
    {
        return null;
    }

    if (property.ValueKind !=
        JsonValueKind.String)
    {
        return null;
    }

    return property.GetString();
}

static string BuildDiscordAvatarUrl(
    string discordUserId,
    string? avatarHash)
{
    if (string.IsNullOrWhiteSpace(
            avatarHash))
    {
        return string.Empty;
    }

    return
        $"https://cdn.discordapp.com/avatars/{discordUserId}/{avatarHash}.png?size=128";
}

static string LimitString(
    string value,
    int maxLength)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return "PLAYER";
    }

    var trimmed =
        value.Trim();

    if (trimmed.Length <= maxLength)
    {
        return trimmed;
    }

    return trimmed[..maxLength];
}

static async Task<string>
    CreateUniqueUsernameAsync(
        FlashbackDbContext db,
        string requestedName)
{
    var baseName =
        LimitString(
            requestedName,
            24);

    if (string.IsNullOrWhiteSpace(
            baseName))
    {
        baseName = "PLAYER";
    }

    var candidate =
        baseName;

    var number =
        1;

    while (await db.Accounts.AnyAsync(
               x =>
                   x.Username ==
                   candidate))
    {
        var suffix =
            $"_{number}";

        var maxBaseLength =
            32 - suffix.Length;

        var shortened =
            baseName.Length >
                maxBaseLength
                ? baseName[..maxBaseLength]
                : baseName;

        candidate =
            shortened +
            suffix;

        number++;
    }

    return candidate;
}

static object CreateAccountResponse(
    Account account)
{
    var profile =
        account.Profile;

    return new
    {
        id =
            account.Id,

        username =
            account.Username,

        email =
            account.Email,

        discordUserId =
            account.DiscordUserId,

        discordUsername =
            account.DiscordUsername,

        discordAvatarUrl =
            account.DiscordAvatarUrl,

        createdAtUtc =
            account.CreatedAtUtc,

        profile =
            new
            {
                displayName =
                    profile?.DisplayName ??
                    account.Username,

                level =
                    profile?.Level ??
                    1,

                vBucks =
                    profile?.FlashbackCredits ??
                    0,

                flashbackCredits =
                    profile?.FlashbackCredits ??
                    0
            }
    };
}

static string CreateHtmlPage(
    string title,
    string heading,
    string message)
{
    var safeTitle =
        WebUtility.HtmlEncode(
            title);

    var safeHeading =
        WebUtility.HtmlEncode(
            heading);

    var safeMessage =
        WebUtility.HtmlEncode(
            message);

    var html =
        new StringBuilder();

    html.AppendLine(
        "<!doctype html>");

    html.AppendLine(
        "<html lang=\"en\">");

    html.AppendLine(
        "<head>");

    html.AppendLine(
        "<meta charset=\"utf-8\">");

    html.AppendLine(
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");

    html.AppendLine(
        "<title>" +
        safeTitle +
        "</title>");

    html.AppendLine(
        "<style>");

    html.AppendLine(
        "html,body{width:100%;height:100%;margin:0;}");

    html.AppendLine(
        "body{display:flex;align-items:center;justify-content:center;background:#080808;color:white;font-family:Arial,Helvetica,sans-serif;}");

    html.AppendLine(
        ".card{width:460px;padding:38px;border:1px solid #292929;border-radius:18px;background:#111111;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.45);}");

    html.AppendLine(
        ".logo{color:#d4af37;font-size:28px;font-weight:900;letter-spacing:.08em;}");

    html.AppendLine(
        "h1{margin-top:24px;font-size:25px;}");

    html.AppendLine(
        "p{color:#858585;line-height:1.6;}");

    html.AppendLine(
        ".line{width:100%;height:2px;margin-top:26px;background:#252525;}");

    html.AppendLine(
        ".small{margin-top:15px;color:#555555;font-size:11px;}");

    html.AppendLine(
        "</style>");

    html.AppendLine(
        "</head>");

    html.AppendLine(
        "<body>");

    html.AppendLine(
        "<div class=\"card\">");

    html.AppendLine(
        "<div class=\"logo\">PROJECT FLASHBACK</div>");

    html.AppendLine(
        "<h1>" +
        safeHeading +
        "</h1>");

    html.AppendLine(
        "<p>" +
        safeMessage +
        "</p>");

    html.AppendLine(
        "<div class=\"line\"></div>");

    html.AppendLine(
        "<div class=\"small\">You can close this window.</div>");

    html.AppendLine(
        "</div>");

    html.AppendLine(
        "</body>");

    html.AppendLine(
        "</html>");

    return html.ToString();
}

// ============================================================
// RUN
// ============================================================

app.Run();

// ============================================================
// TYPES
// ============================================================

sealed class PendingDiscordLogin
{
    public string Ticket { get; init; } =
        string.Empty;

    public DateTime CreatedAtUtc { get; init; }

    public bool Completed { get; set; }

    public string? SessionToken { get; set; }

    public object? Account { get; set; }
}