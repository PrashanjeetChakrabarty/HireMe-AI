using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace BackendAPI.Tests;

public class PublicRepoSafetyTests
{
    private static readonly string[] SkippedFolders =
    {
        ".git", "bin", "obj", "node_modules", "dist", ".vs", ".vercel", "venv", ".venv", "site-packages", "__pycache__"
    };

    private static readonly string[] TextFiles =
    {
        ".cs", ".json", ".md", ".yml", ".yaml", ".js", ".jsx", ".html", ".css", ".sh", ".sql", ".txt", ".xml", ".csproj", ".slnx", ".py", ".example"
    };

    // Built from pieces, so this file does not hold the words it looks for.
    private static readonly string MailLoginDomain = "smtp-" + "brevo.com";
    private const string ProjectMailbox = "workbuildwithus@gmail.com";

    [Fact]
    public void NoFile_HoldsTheMailServerLoginId()
    {
        var offenders = TextFilesInRepo()
            .Where(file => File.ReadAllText(file).Contains(MailLoginDomain, StringComparison.OrdinalIgnoreCase))
            .Select(file => Path.GetRelativePath(RepoRoot(), file))
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void NoFile_HoldsAPersonalGmailAddress()
    {
        var gmail = new Regex(@"[A-Za-z0-9._%+-]+@gmail\.com", RegexOptions.IgnoreCase);
        var offenders = new List<string>();
        foreach (var file in TextFilesInRepo())
        {
            var strangers = gmail.Matches(File.ReadAllText(file))
                .Select(match => match.Value)
                .Where(address => !address.Equals(ProjectMailbox, StringComparison.OrdinalIgnoreCase))
                .Distinct()
                .ToList();
            if (strangers.Count > 0)
            {
                offenders.Add(Path.GetRelativePath(RepoRoot(), file));
            }
        }

        Assert.Empty(offenders);
    }

    [Fact]
    public void TheFilesForAPublicRepository_Exist()
    {
        foreach (var path in new[] { "LICENSE", "SECURITY.md", "DEPLOYMENT.md", "Frontend/.env.example" })
        {
            Assert.True(File.Exists(Path.Combine(RepoRoot(), path)), path + " is missing");
        }
    }

    [Fact]
    public void NoFile_HoldsAPersonalNameOrARealServiceAddress()
    {
        // Built from pieces, so this file does not hold the words it looks for.
        var names = new[] { "prashan" + "jeet", "chakra" + "barty" };
        var addresses = new[] { "e3exf" + "gckhzfad2cg", "proud" + "grass" };
        var offenders = TextFilesInRepo()
            .Where(file =>
            {
                var text = File.ReadAllText(file);
                var holdsAddress = addresses.Any(word => text.Contains(word, StringComparison.OrdinalIgnoreCase));
                var holdsName = !file.EndsWith(".md", StringComparison.OrdinalIgnoreCase)
                    && names.Any(word => text.Contains(word, StringComparison.OrdinalIgnoreCase));
                return holdsAddress || holdsName;
            })
            .Select(file => Path.GetRelativePath(RepoRoot(), file))
            .ToList();

        Assert.Empty(offenders);
    }

    private static IEnumerable<string> TextFilesInRepo()
    {
        var root = RepoRoot();
        var candidates = TrackedFiles(root) ?? WalkFiles(root);
        return candidates.Where(file =>
            TextFiles.Contains(Path.GetExtension(file).ToLowerInvariant()) && File.Exists(file) && new FileInfo(file).Length < 2_000_000);
    }

    // The files Git tracks are exactly the files that get published. Local folders (a Python virtual environment,
    // build output) are not part of the repository. When Git cannot be run, the folders are walked instead.
    private static List<string>? TrackedFiles(string root)
    {
        try
        {
            var start = new ProcessStartInfo("git")
            {
                WorkingDirectory = root,
                RedirectStandardOutput = true,
                UseShellExecute = false
            };
            start.ArgumentList.Add("ls-files");
            using var process = Process.Start(start);
            if (process == null)
            {
                return null;
            }

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                return null;
            }

            return output
                .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => Path.Combine(root, line.Trim().Replace('/', Path.DirectorySeparatorChar)))
                .ToList();
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static IEnumerable<string> WalkFiles(string root)
    {
        var pending = new Stack<string>();
        pending.Push(root);
        while (pending.Count > 0)
        {
            var folder = pending.Pop();
            foreach (var sub in Directory.EnumerateDirectories(folder))
            {
                if (!SkippedFolders.Contains(Path.GetFileName(sub)))
                {
                    pending.Push(sub);
                }
            }

            foreach (var file in Directory.EnumerateFiles(folder))
            {
                yield return file;
            }
        }
    }

    private static string RepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "BackendAPI.Core")))
        {
            dir = dir.Parent;
        }

        return dir?.FullName ?? throw new InvalidOperationException("Could not find the repository folder.");
    }
}
