using System.Text.RegularExpressions;
using BackendAPI.Core.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class EmailTemplateTests
{
    private static EmailBranding Brand() => new EmailBranding
    {
        CompanyName = "HireMe AI",
        LegalName = "HireMe AI",
        ProductName = "AI Resume Screener",
        WebsiteUrl = "https://example.test"
    };

    private const string ApplicationBody =
        "Hi Asha,\n\nYour application for \"Backend developer\" at Acme has been submitted successfully.\n\nThanks,\nHireMe AI Team";

    [Fact]
    public void Build_PutsTheMessageInsideTheCompanyHeaderAndFooter()
    {
        var content = EmailTemplate.Build("Application Submitted", ApplicationBody, Brand());

        Assert.Contains("HireMe AI", content.Html);
        Assert.Contains("AI Resume Screener", content.Html);
        Assert.Contains("HireMe AI", content.Html);
        Assert.Contains("https://example.test/terms", content.Html);
        Assert.Contains("https://example.test/privacy", content.Html);
        Assert.Contains("Hi Asha,", content.Html);
        Assert.Contains("has been submitted successfully", content.Html);
    }

    [Fact]
    public void Build_AddsOneSignOffAndKeepsTheOriginalOpeningWords()
    {
        var content = EmailTemplate.Build("Application Submitted", ApplicationBody, Brand());

        Assert.Equal(1, Regex.Matches(content.Html, "The HireMe AI Team").Count);
        Assert.Contains("Thanks,", content.Html);
    }

    [Fact]
    public void Build_WithoutASignOff_UsesWarmRegards()
    {
        var content = EmailTemplate.Build("Notice", "Hi Asha,\n\nThis is a plain message.", Brand());

        Assert.Contains("Warm regards,", content.Html);
        Assert.Contains("The HireMe AI Team", content.Html);
    }

    [Fact]
    public void Build_EscapesTextSoNamesCannotBreakTheEmail()
    {
        var content = EmailTemplate.Build("Notice", "Hi <b>Asha</b>,\n\nHello <script>x</script>", Brand());

        Assert.DoesNotContain("<b>Asha</b>", content.Html);
        Assert.DoesNotContain("<script>", content.Html);
        Assert.Contains("&lt;b&gt;Asha", content.Html);
    }

    [Fact]
    public void Build_ShowsTheVerificationCodeInABigBox()
    {
        var content = EmailTemplate.Build(
            "Verify your email",
            "Hi Asha,\n\nYour verification code is 123456. It expires in 10 minutes.\n\nThanks,\nHireMe AI Team",
            Brand());

        Assert.Contains("123456</span>", content.Html);
        Assert.DoesNotContain("Go to my dashboard", content.Html);
    }

    [Fact]
    public void Build_LeavesOtherNumbersAloneInEmailsWithoutACode()
    {
        var content = EmailTemplate.Build("Interview scheduled", "Hi Asha,\n\nThe venue pin code is 560001.", Brand());

        Assert.DoesNotContain("560001</span>", content.Html);
        Assert.Contains("Go to my dashboard", content.Html);
        Assert.Contains("https://example.test/dashboard", content.Html);
    }

    [Fact]
    public void Build_KeepsEachParagraphSeparate()
    {
        var content = EmailTemplate.Build("Notice", "Hi Asha,\n\nFirst part.\n\nSecond part.", Brand());

        Assert.True(Regex.Matches(content.Html, "<p ").Count >= 4);
    }

    [Fact]
    public void Build_ShowsTheAddressAndSupportEmailOnlyWhenTheyAreSet()
    {
        var plain = EmailTemplate.Build("Notice", "Hi Asha,\n\nHello.", Brand());
        Assert.DoesNotContain("Support:", plain.Html);

        var branding = Brand();
        branding.Address = "12 Main Road, Pune";
        branding.SupportEmail = "support@example.test";
        var full = EmailTemplate.Build("Notice", "Hi Asha,\n\nHello.", branding);

        Assert.Contains("12 Main Road, Pune", full.Html);
        Assert.Contains("support@example.test", full.Html);
    }

    [Fact]
    public void Build_AlsoGivesAPlainTextCopyWithTheCompanyName()
    {
        var content = EmailTemplate.Build("Application Submitted", ApplicationBody, Brand());

        Assert.Contains("Your application for", content.Text);
        Assert.Contains("HireMe AI", content.Text);
        Assert.Contains("https://example.test/privacy", content.Text);
    }

    [Fact]
    public void FromConfiguration_UsesTheDefaultsWhenNothingIsSet()
    {
        var configuration = new Mock<IConfiguration>();

        var branding = EmailBranding.FromConfiguration(configuration.Object);

        Assert.Equal("HireMe AI", branding.CompanyName);
        Assert.Equal("HireMe AI", branding.LegalName);
        Assert.Equal(string.Empty, branding.Address);
    }

    [Fact]
    public void FromConfiguration_UsesTheSettingsAndTrimsTheEndOfTheWebsiteAddress()
    {
        var configuration = new Mock<IConfiguration>();
        configuration.Setup(c => c["EmailBranding:CompanyName"]).Returns("Acme Hire");
        configuration.Setup(c => c["EmailBranding:WebsiteUrl"]).Returns("https://acme.test/");

        var branding = EmailBranding.FromConfiguration(configuration.Object);

        Assert.Equal("Acme Hire", branding.CompanyName);
        Assert.Equal("https://acme.test", branding.WebsiteUrl);
    }
}
