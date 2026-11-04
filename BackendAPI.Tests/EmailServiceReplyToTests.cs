using System.Collections.Generic;
using BackendAPI.Core.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace BackendAPI.Tests;

public class EmailServiceReplyToTests
{
    private static IConfiguration Config(string? replyTo)
    {
        var values = new Dictionary<string, string?> { ["SmtpSettings:Host"] = "smtp.example.test" };
        if (replyTo != null)
        {
            values["SmtpSettings:ReplyTo"] = replyTo;
        }

        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }

    [Fact]
    public void ReplyToFrom_WhenNotSet_IsNull()
    {
        Assert.Null(EmailService.ReplyToFrom(Config(null)));
    }

    [Fact]
    public void ReplyToFrom_WhenSet_IsTheProjectMailbox()
    {
        var address = EmailService.ReplyToFrom(Config("support@example.test"));

        Assert.NotNull(address);
        Assert.Equal("support@example.test", address!.Address);
        Assert.Equal("HireMe AI", address.Name);
    }

    [Fact]
    public void ReplyToFrom_IgnoresABlankValueAndTrimsSpaces()
    {
        Assert.Null(EmailService.ReplyToFrom(Config("   ")));
        Assert.Equal("support@example.test", EmailService.ReplyToFrom(Config("  support@example.test "))!.Address);
    }
}
