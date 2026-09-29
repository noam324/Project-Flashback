using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Win32;
using SharpCompress.Archives;
using SharpCompress.Common;

namespace Flashback.Launcher;

public partial class MainWindow : Window
{
    private const string ApiBaseUrl =
        "http://localhost:5056";

    private const string DownloadUrl =
        "http://localhost:8080/Fortnite-12.50-CL-13137020.rar";

    private const string BuildVersion =
        "12.50";

    private const string BuildCL =
        "13137020";

    private const string ArchiveFileName =
        "Fortnite-12.50-CL-13137020.rar";

    private const string ExpectedSha256 =
        "A82048E0666D646C359952A2CB9CA3187AB53C6F687813BC6FB33088A3A46923";

    private readonly HttpClient _httpClient =
        new HttpClient();

    private CancellationTokenSource? _downloadCancellation;

    private string? _sessionToken;

    private string? _manuallyLocatedExecutable;

    private string SessionDirectory =>
        Path.Combine(
            Environment.GetFolderPath(
                Environment.SpecialFolder.LocalApplicationData),
            "ProjectFlashback");

    private string SessionFile =>
        Path.Combine(
            SessionDirectory,
            "session.dat");

    private string LauncherLogFile =>
        Path.Combine(
            SessionDirectory,
            "launcher.log");

    private string InstallDirectory =>
        Path.Combine(
            SessionDirectory,
            "Builds");

    private string DownloadDirectory =>
        Path.Combine(
            Environment.GetFolderPath(
                Environment.SpecialFolder.UserProfile),
            "Downloads",
            "Project Flashback");

    public MainWindow()
    {
        InitializeComponent();

        ShowLoginPage();

        _httpClient.Timeout =
            TimeSpan.FromMinutes(30);

        Loaded += MainWindow_Loaded;
    }

    // ============================================================
    // WINDOW
    // ============================================================

    private async void MainWindow_Loaded(
        object sender,
        RoutedEventArgs e)
    {
        await TryRestoreSessionAsync();
    }

    // ============================================================
    // SESSION
    // ============================================================

    private async Task TryRestoreSessionAsync()
    {
        try
        {
            if (!File.Exists(SessionFile))
            {
                ShowLoginPage();
                return;
            }

            var encrypted =
                await File.ReadAllBytesAsync(
                    SessionFile);

            var tokenBytes =
                ProtectedData.Unprotect(
                    encrypted,
                    null,
                    DataProtectionScope.CurrentUser);

            var token =
                Encoding.UTF8.GetString(
                    tokenBytes);

            if (string.IsNullOrWhiteSpace(token))
            {
                DeleteSession();
                ShowLoginPage();
                return;
            }

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Get,
                    $"{ApiBaseUrl}/api/auth/session/validate");

            request.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Bearer",
                    token);

            using var response =
                await _httpClient.SendAsync(
                    request);

            if (!response.IsSuccessStatusCode)
            {
                DeleteSession();
                ShowLoginPage();
                return;
            }

            var json =
                await response.Content.ReadAsStringAsync();

            using var document =
                JsonDocument.Parse(json);

            var root =
                document.RootElement;

            if (!root.TryGetProperty(
                    "account",
                    out var account))
            {
                DeleteSession();
                ShowLoginPage();
                return;
            }

            _sessionToken = token;

            ShowHome(account);
        }
        catch (Exception ex)
        {
            WriteLauncherLog(
                $"Session restore failed: {ex}");

            DeleteSession();
            ShowLoginPage();
        }
    }

    private void SaveSession(
        string token)
    {
        Directory.CreateDirectory(
            SessionDirectory);

        var plainBytes =
            Encoding.UTF8.GetBytes(token);

        var encrypted =
            ProtectedData.Protect(
                plainBytes,
                null,
                DataProtectionScope.CurrentUser);

        File.WriteAllBytes(
            SessionFile,
            encrypted);
    }

    private void DeleteSession()
    {
        _sessionToken = null;

        try
        {
            if (File.Exists(SessionFile))
            {
                File.Delete(SessionFile);
            }
        }
        catch
        {
        }
    }

    // ============================================================
    // DISCORD LOGIN
    // ============================================================

    private async void DiscordLoginButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        try
        {
            DiscordLoginButton.IsEnabled =
                false;

            StatusText.Text =
                "Opening Discord...";

            using var response =
                await _httpClient.GetAsync(
                    $"{ApiBaseUrl}/api/auth/discord/start");

            response.EnsureSuccessStatusCode();

            var json =
                await response.Content.ReadAsStringAsync();

            using var document =
                JsonDocument.Parse(json);

            var root =
                document.RootElement;

            string? ticket = null;
            string? authorizeUrl = null;

            if (root.TryGetProperty(
                    "ticket",
                    out var ticketElement))
            {
                ticket =
                    ticketElement.GetString();
            }

            if (root.TryGetProperty(
                    "authorizeUrl",
                    out var authorizeElement))
            {
                authorizeUrl =
                    authorizeElement.GetString();
            }

            if (string.IsNullOrWhiteSpace(
                    authorizeUrl) &&
                root.TryGetProperty(
                    "url",
                    out var urlElement))
            {
                authorizeUrl =
                    urlElement.GetString();
            }

            if (string.IsNullOrWhiteSpace(ticket) ||
                string.IsNullOrWhiteSpace(authorizeUrl))
            {
                throw new InvalidOperationException(
                    "Invalid Discord login response.");
            }

            Process.Start(
                new ProcessStartInfo
                {
                    FileName =
                        authorizeUrl,

                    UseShellExecute =
                        true
                });

            StatusText.Text =
                "Waiting for Discord login...";

            await WaitForLoginAsync(
                ticket);
        }
        catch (Exception ex)
        {
            StatusText.Text =
                "Discord login failed.";

            WriteLauncherLog(
                $"Discord login error: {ex}");
        }
        finally
        {
            DiscordLoginButton.IsEnabled =
                true;
        }
    }

    private async Task WaitForLoginAsync(
        string ticket)
    {
        for (var i = 0; i < 180; i++)
        {
            await Task.Delay(1000);

            try
            {
                var url =
                    $"{ApiBaseUrl}/api/auth/discord/status/{Uri.EscapeDataString(ticket)}";

                using var response =
                    await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    continue;

                var json =
                    await response.Content.ReadAsStringAsync();

                using var document =
                    JsonDocument.Parse(json);

                var root =
                    document.RootElement;

                if (!root.TryGetProperty(
                        "status",
                        out var statusElement))
                {
                    continue;
                }

                var status =
                    statusElement.GetString();

                if (status == "pending")
                    continue;

                if (status != "complete")
                    continue;

                if (!root.TryGetProperty(
                        "sessionToken",
                        out var tokenElement))
                {
                    continue;
                }

                var token =
                    tokenElement.GetString();

                if (string.IsNullOrWhiteSpace(token))
                    continue;

                _sessionToken =
                    token;

                SaveSession(token);

                if (root.TryGetProperty(
                        "account",
                        out var account))
                {
                    ShowHome(account);
                }
                else
                {
                    await TryRestoreSessionAsync();
                }

                return;
            }
            catch (Exception ex)
            {
                WriteLauncherLog(
                    $"Discord polling error: {ex.Message}");
            }
        }

        StatusText.Text =
            "Discord login timed out.";
    }

    // ============================================================
    // UI
    // ============================================================

    private void ShowLoginPage()
    {
        LoginPage.Visibility =
            Visibility.Visible;

        HomePage.Visibility =
            Visibility.Collapsed;

        StatusText.Text =
            "Ready to sign in.";
    }

    private void ShowHome(
        JsonElement account)
    {
        LoginPage.Visibility =
            Visibility.Collapsed;

        HomePage.Visibility =
            Visibility.Visible;

        ShowHomePage();

        var username =
            "PLAYER";

        if (account.TryGetProperty(
                "discordUsername",
                out var discordUsername))
        {
            username =
                discordUsername.GetString()
                ?? username;
        }
        else if (account.TryGetProperty(
                     "username",
                     out var usernameElement))
        {
            username =
                usernameElement.GetString()
                ?? username;
        }

        HomeUsernameText.Text =
            username;

        WelcomeText.Text =
            $"Welcome back, {username}";

        LevelText.Text =
            "1";

        CreditsText.Text =
            "0";
    }

    private void ShowHomePage()
    {
        HomeContent.Visibility =
            Visibility.Visible;

        DownloadContent.Visibility =
            Visibility.Collapsed;

        PlaceholderContent.Visibility =
            Visibility.Collapsed;

        PageTitleText.Text =
            "HOME";

        PageSubtitleText.Text =
            "Welcome back";
    }

    private void ShowDownloadPage()
    {
        HomeContent.Visibility =
            Visibility.Collapsed;

        DownloadContent.Visibility =
            Visibility.Visible;

        PlaceholderContent.Visibility =
            Visibility.Collapsed;

        PageTitleText.Text =
            "DOWNLOAD";

        PageSubtitleText.Text =
            "Download and manage your game build";

        UpdateBuildState();
    }

    private void ShowPlaceholder(
        string title,
        string description)
    {
        HomeContent.Visibility =
            Visibility.Collapsed;

        DownloadContent.Visibility =
            Visibility.Collapsed;

        PlaceholderContent.Visibility =
            Visibility.Visible;

        PageTitleText.Text =
            title;

        PageSubtitleText.Text =
            description;

        PlaceholderTitle.Text =
            title;

        PlaceholderDescription.Text =
            description;
    }

    // ============================================================
    // NAVIGATION
    // ============================================================

    private void HomeButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        ShowHomePage();
    }

    private void DownloadNavButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        ShowDownloadPage();
    }

    private void LockerButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        ShowPlaceholder(
            "LOCKER",
            "Your cosmetics will appear here.");
    }

    private void TournamentsButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        ShowPlaceholder(
            "TOURNAMENTS",
            "Competitive events are coming soon.");
    }

    private void LeaderboardsButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        ShowPlaceholder(
            "LEADERBOARDS",
            "Player rankings are coming soon.");
    }

    private void SettingsButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        ShowPlaceholder(
            "SETTINGS",
            "Launcher settings are coming soon.");
    }

    // ============================================================
    // DOWNLOAD
    // ============================================================

    private async void DownloadButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        if (_downloadCancellation is not null)
            return;

        try
        {
            Directory.CreateDirectory(
                DownloadDirectory);

            Directory.CreateDirectory(
                InstallDirectory);

            var archivePath =
                Path.Combine(
                    DownloadDirectory,
                    ArchiveFileName);

            _downloadCancellation =
                new CancellationTokenSource();

            var cancellationToken =
                _downloadCancellation.Token;

            DownloadButton.IsEnabled =
                false;

            PlayBuildButton.IsEnabled =
                false;

            CancelDownloadButton.Visibility =
                Visibility.Visible;

            DownloadProgress.Visibility =
                Visibility.Visible;

            DownloadProgress.Value =
                0;

            DownloadStatusText.Text =
                "DOWNLOADING...";

            DownloadDetailsText.Text =
                "Connecting to download server...";

            DownloadEtaText.Text =
                "";

            WriteLauncherLog(
                $"Download started: {DownloadUrl}");

            using var response =
                await _httpClient.GetAsync(
                    DownloadUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);

            response.EnsureSuccessStatusCode();

            var totalBytes =
                response.Content.Headers.ContentLength;

            await using var input =
                await response.Content.ReadAsStreamAsync(
                    cancellationToken);

            await using var output =
                new FileStream(
                    archivePath,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.None,
                    1024 * 1024,
                    useAsync: true);

            var buffer =
                new byte[4 * 1024 * 1024];

            long downloadedBytes =
                0;

            var stopwatch =
                Stopwatch.StartNew();

            int bytesRead;

            while ((bytesRead =
                await input.ReadAsync(
                    buffer.AsMemory(),
                    cancellationToken)) > 0)
            {
                await output.WriteAsync(
                    buffer.AsMemory(
                        0,
                        bytesRead),
                    cancellationToken);

                downloadedBytes +=
                    bytesRead;

                UpdateDownloadProgress(
                    downloadedBytes,
                    totalBytes,
                    stopwatch.Elapsed);
            }

            await output.FlushAsync(
                cancellationToken);

            DownloadStatusText.Text =
                "VERIFYING DOWNLOAD...";

            DownloadDetailsText.Text =
                "Calculating SHA-256...";

            var actualHash =
                await CalculateSha256Async(
                    archivePath,
                    cancellationToken);

            WriteLauncherLog(
                $"Downloaded SHA256: {actualHash}");

            if (!string.Equals(
                    actualHash,
                    ExpectedSha256,
                    StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    File.Delete(archivePath);
                }
                catch
                {
                }

                throw new InvalidDataException(
                    "SHA-256 mismatch.\n\n" +
                    $"Expected:\n{ExpectedSha256}\n\n" +
                    $"Actual:\n{actualHash}");
            }

            DownloadStatusText.Text =
                "SHA-256 VERIFIED";

            DownloadDetailsText.Text =
                actualHash;

            DownloadEtaText.Text =
                "Extracting build...";

            await ExtractBuildAsync(
                archivePath,
                cancellationToken);

            DownloadStatusText.Text =
                "BUILD READY";

            DownloadDetailsText.Text =
                $"Build {BuildVersion} • CL {BuildCL}";

            DownloadEtaText.Text =
                "Installation completed.";

            WriteLauncherLog(
                "Build extraction completed.");
        }
        catch (OperationCanceledException)
        {
            DownloadStatusText.Text =
                "DOWNLOAD CANCELLED";

            DownloadDetailsText.Text =
                "";

            DownloadEtaText.Text =
                "";
        }
        catch (Exception ex)
        {
            DownloadStatusText.Text =
                "DOWNLOAD FAILED";

            DownloadDetailsText.Text =
                ex.Message;

            DownloadEtaText.Text =
                "";

            WriteLauncherLog(
                $"Download failed: {ex}");
        }
        finally
        {
            _downloadCancellation?.Dispose();

            _downloadCancellation =
                null;

            DownloadProgress.Visibility =
                Visibility.Collapsed;

            CancelDownloadButton.Visibility =
                Visibility.Collapsed;

            DownloadButton.IsEnabled =
                true;

            UpdateBuildState();
        }
    }

    private void UpdateDownloadProgress(
        long downloaded,
        long? total,
        TimeSpan elapsed)
    {
        Dispatcher.Invoke(() =>
        {
            if (total.HasValue &&
                total.Value > 0)
            {
                var percent =
                    downloaded * 100.0 /
                    total.Value;

                DownloadProgress.Value =
                    percent;

                DownloadDetailsText.Text =
                    $"{FormatBytes(downloaded)} / {FormatBytes(total.Value)}";

                if (elapsed.TotalSeconds > 0)
                {
                    var speed =
                        downloaded /
                        elapsed.TotalSeconds;

                    var remaining =
                        total.Value -
                        downloaded;

                    var seconds =
                        remaining /
                        Math.Max(
                            speed,
                            1);

                    DownloadEtaText.Text =
                        $"{FormatBytes((long)speed)}/s • ETA {FormatTime(TimeSpan.FromSeconds(seconds))}";
                }
            }
            else
            {
                DownloadDetailsText.Text =
                    FormatBytes(downloaded);
            }
        });
    }

    private async Task ExtractBuildAsync(
        string archivePath,
        CancellationToken cancellationToken)
    {
        var buildDirectory =
            Path.Combine(
                InstallDirectory,
                $"{BuildVersion}-CL-{BuildCL}");

        Directory.CreateDirectory(
            InstallDirectory);

        if (Directory.Exists(
                buildDirectory))
        {
            Directory.Delete(
                buildDirectory,
                true);
        }

        Directory.CreateDirectory(
            buildDirectory);

        await Task.Run(() =>
        {
            cancellationToken.ThrowIfCancellationRequested();

            using var archive =
                ArchiveFactory.OpenArchive(
                    archivePath);

            archive.WriteToDirectory(
                buildDirectory,
                new ExtractionOptions
                {
                    ExtractFullPath = true,
                    Overwrite = true,
                    CheckCrc = true
                });

        }, cancellationToken);
    }

    // ============================================================
    // HASH
    // ============================================================

    private static async Task<string>
        CalculateSha256Async(
            string file,
            CancellationToken cancellationToken)
    {
        await using var stream =
            new FileStream(
                file,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                1024 * 1024,
                useAsync: true);

        using var sha =
            SHA256.Create();

        var buffer =
            new byte[4 * 1024 * 1024];

        int bytesRead;

        while ((bytesRead =
            await stream.ReadAsync(
                buffer.AsMemory(),
                cancellationToken)) > 0)
        {
            sha.TransformBlock(
                buffer,
                0,
                bytesRead,
                null,
                0);
        }

        sha.TransformFinalBlock(
            Array.Empty<byte>(),
            0,
            0);

        return Convert.ToHexString(
            sha.Hash!);
    }

    // ============================================================
    // BUILD LOCATION
    // ============================================================

    private string? FindGameExecutable()
    {
        if (!string.IsNullOrWhiteSpace(
                _manuallyLocatedExecutable) &&
            File.Exists(
                _manuallyLocatedExecutable))
        {
            return _manuallyLocatedExecutable;
        }

        if (!Directory.Exists(
                InstallDirectory))
        {
            return null;
        }

        try
        {
            return Directory
                .EnumerateFiles(
                    InstallDirectory,
                    "FortniteClient-Win64-Shipping.exe",
                    SearchOption.AllDirectories)
                .FirstOrDefault();
        }
        catch (Exception ex)
        {
            WriteLauncherLog(
                $"Build search failed: {ex}");

            return null;
        }
    }

    private void UpdateBuildState()
    {
        var executable =
            FindGameExecutable();

        if (!string.IsNullOrWhiteSpace(executable) &&
            File.Exists(executable))
        {
            DownloadStatusText.Text =
                "BUILD INSTALLED";

            DownloadDetailsText.Text =
                $"Build {BuildVersion} • CL {BuildCL}";

            DownloadEtaText.Text =
                executable;

            PlayBuildButton.IsEnabled =
                true;

            DownloadButton.Content =
                "RE-DOWNLOAD";

            return;
        }

        DownloadStatusText.Text =
            "BUILD NOT INSTALLED";

        DownloadDetailsText.Text =
            $"Build {BuildVersion} • CL {BuildCL}";

        DownloadEtaText.Text =
            "Download the build to continue.";

        PlayBuildButton.IsEnabled =
            false;

        DownloadButton.Content =
            "DOWNLOAD";
    }

    private void LocateBuildButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        var dialog =
            new OpenFileDialog
            {
                Title =
                    "Locate FortniteClient-Win64-Shipping.exe",

                Filter =
                    "Fortnite game executable|FortniteClient-Win64-Shipping.exe|Executable files|*.exe"
            };

        if (dialog.ShowDialog() != true)
            return;

        if (!string.Equals(
                Path.GetFileName(
                    dialog.FileName),
                "FortniteClient-Win64-Shipping.exe",
                StringComparison.OrdinalIgnoreCase))
        {
            MessageBox.Show(
                "Please select FortniteClient-Win64-Shipping.exe.",
                "Project Flashback",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);

            return;
        }

        _manuallyLocatedExecutable =
            dialog.FileName;

        DownloadStatusText.Text =
            "BUILD LOCATED";

        DownloadDetailsText.Text =
            dialog.FileName;

        DownloadEtaText.Text =
            "Ready to launch.";

        PlayBuildButton.IsEnabled =
            true;

        WriteLauncherLog(
            $"Build manually located: {dialog.FileName}");
    }

    // ============================================================
    // PLAY
    // ============================================================

    private void PlayNowButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        LaunchInstalledBuild();
    }

    private void PlayBuildButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        LaunchInstalledBuild();
    }

    private void LaunchInstalledBuild()
    {
        try
        {
            var executable =
                FindGameExecutable();

            if (string.IsNullOrWhiteSpace(executable) ||
                !File.Exists(executable))
            {
                ShowLaunchFailure(
                    "The game build was not found.");

                return;
            }

            var workingDirectory =
                Path.GetDirectoryName(
                    executable);

            if (string.IsNullOrWhiteSpace(
                    workingDirectory))
            {
                ShowLaunchFailure(
                    "The game working directory could not be determined.");

                return;
            }

            WriteLauncherLog(
                $"PLAY clicked. Executable: {executable}");

            WriteLauncherLog(
                $"Working directory: {workingDirectory}");

            var process =
                new Process
                {
                    StartInfo =
                        new ProcessStartInfo
                        {
                            FileName =
                                executable,

                            WorkingDirectory =
                                workingDirectory,

                            UseShellExecute =
                                true
                        }
                };

            if (!process.Start())
            {
                process.Dispose();

                ShowLaunchFailure(
                    "Windows could not start the game.");

                return;
            }

            var processId =
                process.Id;

            WriteLauncherLog(
                $"Game process started. PID: {processId}");

            _ = MonitorGameProcessAsync(
                process,
                processId);
        }
        catch (Exception ex)
        {
            ShowLaunchFailure(
                ex.Message);

            WriteLauncherLog(
                $"Launch exception: {ex}");
        }
    }

    private async Task MonitorGameProcessAsync(
        Process process,
        int processId)
    {
        try
        {
            await process.WaitForExitAsync();

            WriteLauncherLog(
                $"Game process exited. PID: {processId}, ExitCode: {process.ExitCode}");

            await Dispatcher.InvokeAsync(() =>
            {
                DownloadStatusText.Text =
                    $"GAME EXITED ({process.ExitCode})";
            });
        }
        catch (Exception ex)
        {
            WriteLauncherLog(
                $"Process monitor error: {ex}");
        }
        finally
        {
            process.Dispose();
        }
    }

    private void ShowLaunchFailure(
        string message)
    {
        MessageBox.Show(
            message,
            "Project Flashback",
            MessageBoxButton.OK,
            MessageBoxImage.Warning);

        WriteLauncherLog(
            $"Launch failed: {message}");
    }

    // ============================================================
    // CANCEL
    // ============================================================

    private void CancelDownloadButton_Click(
        object sender,
        RoutedEventArgs e)
    {
        _downloadCancellation?.Cancel();
    }

    // ============================================================
    // LOGGING
    // ============================================================

    private void WriteLauncherLog(
        string message)
    {
        try
        {
            Directory.CreateDirectory(
                SessionDirectory);

            File.AppendAllText(
                LauncherLogFile,
                $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}");
        }
        catch
        {
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private static string FormatBytes(
        long bytes)
    {
        string[] suffixes =
        {
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        };

        double value =
            bytes;

        var index =
            0;

        while (value >= 1024 &&
               index < suffixes.Length - 1)
        {
            value /= 1024;
            index++;
        }

        return $"{value:0.##} {suffixes[index]}";
    }

    private static string FormatTime(
        TimeSpan time)
    {
        if (time.TotalHours >= 1)
        {
            return time.ToString(
                @"hh\:mm\:ss");
        }

        return time.ToString(
            @"mm\:ss");
    }
}