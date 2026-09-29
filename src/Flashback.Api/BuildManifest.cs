namespace Flashback.Api;

public sealed class BuildManifest
{
    public string Version { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Sha256 { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
}
