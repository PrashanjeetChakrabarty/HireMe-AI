using System;
using System.IO;
using System.Linq;
using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class SiteAddressTests
{
    // Built from pieces, so this file does not contain the old address itself.
    private static readonly string OldAddress = "resume-screening" + "-ar.vercel.app";

    [Fact]
    public void EmailBranding_PointsToTheNewWebsiteAddress()
    {
        Assert.Equal("https://hireme-ai-hiring.vercel.app", new EmailBranding().WebsiteUrl);
    }

    [Fact]
    public void NoBackendSourceFile_UsesTheOldWebsiteAddress()
    {
        var root = FindRepoRoot();
        var offenders = new[] { "BackendAPI", "BackendAPI.Core", "BackendAPI.Tests" }
            .SelectMany(folder => Directory.EnumerateFiles(Path.Combine(root, folder), "*.cs", SearchOption.AllDirectories))
            .Where(file =>
            {
                var parts = file.Split(Path.DirectorySeparatorChar);
                return !parts.Contains("bin") && !parts.Contains("obj");
            })
            .Where(file => File.ReadAllText(file).Contains(OldAddress, StringComparison.OrdinalIgnoreCase))
            .Select(file => Path.GetRelativePath(root, file))
            .ToList();

        Assert.Empty(offenders);
    }

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "BackendAPI.Core")))
        {
            dir = dir.Parent;
        }

        return dir?.FullName ?? throw new InvalidOperationException("Could not find the repository folder.");
    }
}
