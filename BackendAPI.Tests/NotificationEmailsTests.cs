using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class NotificationEmailsTests
{
    [Fact]
    public void Welcome_ForACandidate_ExplainsTheFirstSteps()
    {
        var message = NotificationEmails.Welcome("Asha", "Candidate");

        Assert.Equal("Welcome to HireMe AI", message.Subject);
        Assert.Contains("Hi Asha,", message.Body);
        Assert.Contains("Upload your resume", message.Body);
    }

    [Fact]
    public void Welcome_ForARecruiter_ExplainsTheFirstSteps()
    {
        var message = NotificationEmails.Welcome("Ravi", "Recruiter");

        Assert.Contains("Post your first job", message.Body);
        Assert.DoesNotContain("Upload your resume", message.Body);
    }

    [Fact]
    public void Welcome_WithoutAKnownRole_StillWelcomesThePerson()
    {
        var message = NotificationEmails.Welcome("Sam", null);

        Assert.Contains("Welcome to HireMe AI!", message.Body);
        Assert.Contains("Sign in to your dashboard", message.Body);
    }

    [Fact]
    public void AccountDeleted_ConfirmsTheDeletionAndAsksToReportAMistake()
    {
        var message = NotificationEmails.AccountDeleted("Asha");

        Assert.Equal("Your HireMe AI account has been deleted", message.Subject);
        Assert.Contains("has been deleted", message.Body);
        Assert.Contains("did not ask for this", message.Body);
    }

    [Fact]
    public void JobPosted_ListsTheRulesTheRecruiterChose()
    {
        var job = new Job { Title = "Backend developer", ExclusiveApplication = true, HireLockMonths = 6, RejectWaitDays = 30, ResponseDeadlineDays = 7 };

        var message = NotificationEmails.JobPosted("Ravi", job);

        Assert.Contains("Backend developer", message.Subject);
        Assert.Contains("One job at a time", message.Body);
        Assert.Contains("6 months", message.Body);
        Assert.Contains("30 days", message.Body);
        Assert.Contains("reply within 7 days", message.Body);
    }

    [Fact]
    public void JobPosted_WithoutRules_SaysThereAreNoRestrictions()
    {
        var job = new Job { Title = "Tester", ResponseDeadlineDays = 14 };

        Assert.Contains("No extra restrictions.", NotificationEmails.JobPosted("Ravi", job).Body);
    }

    [Fact]
    public void RuleLines_NamesTheWholePlatformForAPlatformWideHirePause()
    {
        var job = new Job { HireLockMonths = 12, HireLockScope = "Platform" };

        Assert.Contains(NotificationEmails.RuleLines(job), line => line.Contains("any job on HireMe AI for 12 months"));
    }

    [Fact]
    public void NewApplicant_ShowsTheCandidateTheJobAndTheScore()
    {
        var message = NotificationEmails.NewApplicant("Ravi", "Asha Rao", "Backend developer", 72.5m);

        Assert.Equal("New applicant for Backend developer", message.Subject);
        Assert.Contains("Asha Rao has applied", message.Body);
        Assert.Contains("72.5%", message.Body);
    }

    [Fact]
    public void NewApplicant_WithoutAScore_SaysItIsNotAvailable()
    {
        var message = NotificationEmails.NewApplicant("Ravi", "Asha Rao", "Backend developer", null);

        Assert.Contains("not available yet", message.Body);
    }
}
