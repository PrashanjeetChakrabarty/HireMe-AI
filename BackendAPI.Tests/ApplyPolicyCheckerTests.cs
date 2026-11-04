using System;
using System.Collections.Generic;
using System.Globalization;
using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class ApplyPolicyCheckerTests
{
    private static readonly DateTime Now = new DateTime(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);

    private static readonly Dictionary<int, string> Statuses = new Dictionary<int, string>
    {
        [1] = "Applied",
        [2] = "Shortlisted",
        [5] = "Rejected",
        [6] = "Hired"
    };

    private static Job NewJob(int jobId, int recruiterId, Action<Job>? rules = null)
    {
        var job = new Job
        {
            JobId = jobId,
            RecruiterId = recruiterId,
            Title = "Job " + jobId,
            Recruiter = new Recruiter { RecruiterId = recruiterId, CompanyName = "Acme" }
        };
        rules?.Invoke(job);
        return job;
    }

    private static Application Earlier(Job job, int statusId, DateTime appliedAt, DateTime? decidedAt = null) =>
        new Application
        {
            ApplicationId = job.JobId,
            JobId = job.JobId,
            Job = job,
            StatusId = statusId,
            AppliedAt = appliedAt,
            DecidedAt = decidedAt
        };

    private static ApplyPolicyResult Check(Job target, params Application[] earlier) =>
        ApplyPolicyChecker.Check(target, earlier, Statuses, Now);

    private static string Date(DateTime value) => value.ToString("d MMMM yyyy", CultureInfo.InvariantCulture);

    [Fact]
    public void NoEarlierApplications_IsAllowed()
    {
        Assert.True(Check(NewJob(20, 1)).Allowed);
    }

    [Fact]
    public void EarlierJobWithoutRules_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1), 1, Now.AddDays(-3));
        Assert.True(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void OneJobAtATime_StillOpenAtTheSameCompany_IsBlocked()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.ExclusiveApplication = true), 1, Now.AddDays(-3));

        var result = Check(NewJob(20, 1), earlier);

        Assert.False(result.Allowed);
        Assert.Contains("Job 10", result.Message);
        Assert.Contains(Date(Now.AddDays(-3).AddDays(14)), result.Message);
    }

    [Fact]
    public void OneJobAtATime_ReplyDeadlinePassed_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.ExclusiveApplication = true), 1, Now.AddDays(-20));
        Assert.True(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void OneJobAtATime_ShortlistedCountsAsOpen_IsBlocked()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.ExclusiveApplication = true), 2, Now.AddDays(-3));
        Assert.False(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void OneJobAtATime_AnotherCompany_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.ExclusiveApplication = true), 1, Now.AddDays(-3));
        Assert.True(Check(NewJob(20, 2), earlier).Allowed);
    }

    [Fact]
    public void OneJobAtATime_AlreadyRejectedWithoutAWait_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.ExclusiveApplication = true), 5, Now.AddDays(-3), Now.AddDays(-1));
        Assert.True(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void OneJobAtATime_NoDeadline_StaysBlockedUntilTheyReply()
    {
        var earlier = Earlier(NewJob(10, 1, j => { j.ExclusiveApplication = true; j.ResponseDeadlineDays = 0; }), 1, Now.AddDays(-100));
        Assert.False(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void HireLock_SameCompany_BlocksUntilItEnds()
    {
        var decided = Now.AddMonths(-2);
        var earlier = Earlier(NewJob(10, 1, j => j.HireLockMonths = 6), 6, Now.AddMonths(-3), decided);

        var result = Check(NewJob(20, 1), earlier);

        Assert.False(result.Allowed);
        Assert.Contains(Date(decided.AddMonths(6)), result.Message);
    }

    [Fact]
    public void HireLock_AnotherCompany_IsAllowedWhenTheLockIsForThatCompanyOnly()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.HireLockMonths = 6), 6, Now.AddMonths(-3), Now.AddMonths(-2));
        Assert.True(Check(NewJob(20, 2), earlier).Allowed);
    }

    [Fact]
    public void HireLock_WholePlatform_BlocksEveryCompany()
    {
        var earlier = Earlier(NewJob(10, 1, j => { j.HireLockMonths = 12; j.HireLockScope = "Platform"; }), 6, Now.AddMonths(-3), Now.AddMonths(-2));
        Assert.False(Check(NewJob(20, 2), earlier).Allowed);
    }

    [Fact]
    public void HireLock_AlreadyOver_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.HireLockMonths = 6), 6, Now.AddMonths(-9), Now.AddMonths(-8));
        Assert.True(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void HireLock_OldHireWithoutADate_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.HireLockMonths = 6), 6, Now.AddMonths(-3), null);
        Assert.True(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void RejectWait_SameCompany_BlocksUntilItEnds()
    {
        var decided = Now.AddDays(-10);
        var earlier = Earlier(NewJob(10, 1, j => j.RejectWaitDays = 90), 5, Now.AddDays(-20), decided);

        var result = Check(NewJob(20, 1), earlier);

        Assert.False(result.Allowed);
        Assert.Contains(Date(decided.AddDays(90)), result.Message);
    }

    [Fact]
    public void RejectWait_AlreadyOver_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.RejectWaitDays = 90), 5, Now.AddDays(-200), Now.AddDays(-100));
        Assert.True(Check(NewJob(20, 1), earlier).Allowed);
    }

    [Fact]
    public void RejectWait_AnotherCompany_IsAllowed()
    {
        var earlier = Earlier(NewJob(10, 1, j => j.RejectWaitDays = 90), 5, Now.AddDays(-20), Now.AddDays(-10));
        Assert.True(Check(NewJob(20, 2), earlier).Allowed);
    }

    [Fact]
    public void TheSameJob_IsIgnoredByTheRules()
    {
        var job = NewJob(10, 1, j => j.ExclusiveApplication = true);
        var earlier = Earlier(job, 1, Now.AddDays(-3));
        Assert.True(Check(job, earlier).Allowed);
    }
}
