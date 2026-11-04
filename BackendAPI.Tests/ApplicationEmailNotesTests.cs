using System;
using System.Globalization;
using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class ApplicationEmailNotesTests
{
    private static readonly DateTime Decided = new DateTime(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);

    private static string Date(DateTime value) => value.ToString("d MMMM yyyy", CultureInfo.InvariantCulture);

    private static Job NewJob() => new Job { Title = "Backend developer", Recruiter = new Recruiter { CompanyName = "Acme" } };

    [Fact]
    public void AppliedNote_MentionsTheReplyPromise()
    {
        var job = NewJob();
        job.ResponseDeadlineDays = 7;

        Assert.Contains("reply within 7 days", ApplicationEmailNotes.AppliedNote(job));
    }

    [Fact]
    public void AppliedNote_ExplainsTheOneJobAtATimeRule()
    {
        var job = NewJob();
        job.ExclusiveApplication = true;
        job.ResponseDeadlineDays = 14;

        var note = ApplicationEmailNotes.AppliedNote(job);

        Assert.Contains("one open application at a time", note);
        Assert.Contains("14 days", note);
    }

    [Fact]
    public void AppliedNote_IsEmptyWhenThereIsNothingToSay()
    {
        var job = NewJob();
        job.ResponseDeadlineDays = 0;

        Assert.Equal(string.Empty, ApplicationEmailNotes.AppliedNote(job));
    }

    [Fact]
    public void RejectedNote_GivesTheDateWhenThereIsAWait()
    {
        var job = NewJob();
        job.RejectWaitDays = 90;

        var note = ApplicationEmailNotes.RejectedNote(job, Decided);

        Assert.Contains("Acme", note);
        Assert.Contains(Date(Decided.AddDays(90)), note);
        Assert.Contains("other companies", note);
    }

    [Fact]
    public void RejectedNote_EncouragesOtherRolesWhenThereIsNoWait()
    {
        var note = ApplicationEmailNotes.RejectedNote(NewJob(), Decided);

        Assert.Contains("apply for other roles", note);
    }

    [Fact]
    public void HiredNote_GivesTheDateForOneCompany()
    {
        var job = NewJob();
        job.HireLockMonths = 6;
        job.HireLockScope = "Recruiter";

        var note = ApplicationEmailNotes.HiredNote(job, Decided);

        Assert.Contains("at Acme", note);
        Assert.Contains(Date(Decided.AddMonths(6)), note);
    }

    [Fact]
    public void HiredNote_SaysHireMeAiWhenTheWholePlatformIsPaused()
    {
        var job = NewJob();
        job.HireLockMonths = 12;
        job.HireLockScope = "Platform";

        Assert.Contains("on HireMe AI", ApplicationEmailNotes.HiredNote(job, Decided));
    }

    [Fact]
    public void HiredNote_IsEmptyWithoutAHirePause()
    {
        Assert.Equal(string.Empty, ApplicationEmailNotes.HiredNote(NewJob(), Decided));
    }
}
