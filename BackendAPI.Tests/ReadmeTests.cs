using System;
using System.IO;
using System.Text.RegularExpressions;
using Xunit;

namespace BackendAPI.Tests;

public class ReadmeTests
{
    [Fact]
    public void Readme_ExistsAndNamesTheProduct()
    {
        var text = File.ReadAllText(Path.Combine(RepoRoot(), "README.md"));

        Assert.Contains("HireMe AI", text);
        foreach (var heading in new[] { "## What it does", "## Features", "## Architecture", "## Run it locally", "## Tests", "## License" })
        {
            Assert.Contains(heading, text);
        }
    }

    [Fact]
    public void EveryLocalLinkAndPictureInTheReadme_Exists()
    {
        var root = RepoRoot();
        var text = File.ReadAllText(Path.Combine(root, "README.md"));
        var links = new Regex(@"(?:\]\(|(?:src|srcset|href)="")([^)"" ]+)");
        var missing = new System.Collections.Generic.List<string>();
        foreach (Match match in links.Matches(text))
        {
            var target = match.Groups[1].Value;
            if (target.StartsWith("http", StringComparison.OrdinalIgnoreCase) || target.StartsWith("mailto:") || target.StartsWith("#"))
            {
                continue;
            }

            var path = target.Split('#')[0];
            if (!File.Exists(Path.Combine(root, path)))
            {
                missing.Add(target);
            }
        }

        Assert.Empty(missing);
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
