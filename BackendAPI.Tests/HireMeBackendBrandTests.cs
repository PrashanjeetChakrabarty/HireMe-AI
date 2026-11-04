using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class HireMeBackendBrandTests
{
    // Built from pieces, so this file does not contain the old name or the glued name itself.
    private static readonly string OldName = "Arie" + "otech";
    private static readonly string Glued = "HireMe" + "Ai";

    [Fact]
    public void EmailBranding_UsesTheNewNameByDefault()
    {
        var branding = new EmailBranding();

        Assert.Equal("HireMe AI", branding.CompanyName);
        Assert.Equal("HireMe AI", branding.LegalName);
    }

    [Fact]
    public void WelcomeEmail_IsSentInTheNewName()
    {
        var message = NotificationEmails.Welcome("Asha", "Candidate");

        Assert.Equal("Welcome to HireMe AI", message.Subject);
        Assert.Contains("Welcome to HireMe AI!", message.Body);
    }

    [Fact]
    public void Emails_EndWithTheNewSignOff()
    {
        var message = NotificationEmails.PasswordChanged("Asha");

        Assert.EndsWith("Thanks,\nHireMe AI Team", message.Body);
    }

    [Fact]
    public void NoBackendSourceFile_MentionsTheOldName()
    {
        var root = FindRepoRoot();
        var offenders = SourceFiles(root)
            .Where(file => File.ReadAllText(file).Contains(OldName, StringComparison.OrdinalIgnoreCase))
            .Select(file => Path.GetRelativePath(root, file))
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void NoEmailText_HasTheNameWithoutASpace()
    {
        // The name has a space in any text ("HireMe AI"). Without a space it only belongs in a C# name.
        // Two ways it went wrong once: glued to a new line mark (\n) or in a sign-off ("... Team").
        var root = FindRepoRoot();
        var offenders = SourceFiles(root)
            .Where(file =>
            {
                var text = File.ReadAllText(file);
                return text.Contains("\\n" + Glued) || text.Contains("\\r" + Glued) || text.Contains(Glued + " Team");
            })
            .Select(file => Path.GetRelativePath(root, file))
            .ToList();

        Assert.Empty(offenders);
    }

    private static IEnumerable<string> SourceFiles(string root)
    {
        foreach (var folder in new[] { "BackendAPI", "BackendAPI.Core", "BackendAPI.Tests" })
        {
            foreach (var file in Directory.EnumerateFiles(Path.Combine(root, folder), "*.cs", SearchOption.AllDirectories))
            {
                var parts = file.Split(Path.DirectorySeparatorChar);
                if (!parts.Contains("bin") && !parts.Contains("obj"))
                {
                    yield return file;
                }
            }
        }
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
