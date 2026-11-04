using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class JobPolicyServiceTests
{
    private static readonly Dictionary<int, string> Statuses = new Dictionary<int, string>
    {
        [1] = "Applied",
        [5] = "Rejected",
        [6] = "Hired"
    };

    private static ApplicationService CreateApplicationService(
        Job job,
        List<Application> candidateApplications,
        out Mock<IApplicationRepository> applications,
        out Mock<IInterviewStatusRepository> statuses)
    {
        applications = new Mock<IApplicationRepository>();
        var candidates = new Mock<ICandidateRepository>();
        var recruiters = new Mock<IRecruiterRepository>();
        var jobs = new Mock<IJobRepository>();
        var resumes = new Mock<IResumeRepository>();
        var aiService = new Mock<IAiServiceClient>();
        var skills = new Mock<ISkillRepository>();
        var profiles = new Mock<ICandidateProfileRepository>();
        statuses = new Mock<IInterviewStatusRepository>();
        var auditLogs = new Mock<IAuditLogRepository>();
        var users = new Mock<IUserRepository>();
        var email = new Mock<IEmailService>();

        candidates.Setup(c => c.GetByUserIdAsync(5)).ReturnsAsync(new Candidate { CandidateId = 1, UserId = 5 });
        recruiters.Setup(r => r.GetByUserIdAsync(9)).ReturnsAsync(new Recruiter { RecruiterId = job.RecruiterId, UserId = 9 });
        jobs.Setup(j => j.GetByIdAsync(job.JobId)).ReturnsAsync(job);
        resumes.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(new Resume { ResumeId = 3, CandidateId = 1, FileName = "cv.pdf", FilePath = "/nowhere/cv.pdf" });
        applications.Setup(a => a.ExistsAsync(job.JobId, 1)).ReturnsAsync(false);
        applications.Setup(a => a.GetByCandidateIdAsync(1)).ReturnsAsync(candidateApplications);
        applications.Setup(a => a.AddAsync(It.IsAny<Application>())).Returns(Task.CompletedTask);
        applications.Setup(a => a.UpdateAsync(It.IsAny<Application>())).Returns(Task.CompletedTask);
        statuses.Setup(s => s.GetIdByNameAsync("Applied")).ReturnsAsync((int?)1);
        statuses.Setup(s => s.GetIdByNameAsync("Hired")).ReturnsAsync((int?)6);
        statuses.Setup(s => s.GetIdByNameAsync("Rejected")).ReturnsAsync((int?)5);
        statuses.Setup(s => s.GetIdByNameAsync("Shortlisted")).ReturnsAsync((int?)2);
        statuses.Setup(s => s.GetAllAsDictionaryAsync()).ReturnsAsync(Statuses);

        return new ApplicationService(
            applications.Object,
            candidates.Object,
            recruiters.Object,
            jobs.Object,
            resumes.Object,
            aiService.Object,
            skills.Object,
            profiles.Object,
            statuses.Object,
            auditLogs.Object,
            users.Object,
            email.Object);
    }

    [Fact]
    public async Task ApplyAsync_BlockedByAnEarlierRule_SavesNothing()
    {
        var earlierJob = new Job
        {
            JobId = 10,
            RecruiterId = 1,
            Title = "Backend developer",
            ExclusiveApplication = true,
            Recruiter = new Recruiter { RecruiterId = 1, CompanyName = "Acme" }
        };
        var earlier = new Application { ApplicationId = 1, JobId = 10, Job = earlierJob, StatusId = 1, AppliedAt = DateTime.UtcNow.AddDays(-2) };
        var targetJob = new Job { JobId = 20, RecruiterId = 1, Title = "Frontend developer", Recruiter = earlierJob.Recruiter };
        var service = CreateApplicationService(targetJob, new List<Application> { earlier }, out var applications, out _);

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ApplyAsync(5, new ApplicationCreateRequest { JobId = 20, ResumeId = 3, AcceptedPolicies = true }));

        Assert.Contains("one job at a time", error.Message);
        applications.Verify(a => a.AddAsync(It.IsAny<Application>()), Times.Never);
    }

    [Fact]
    public async Task ApplyAsync_Allowed_RemembersWhenTheRulesWereAccepted()
    {
        var targetJob = new Job { JobId = 20, RecruiterId = 1, Title = "Frontend developer", Recruiter = new Recruiter { RecruiterId = 1, CompanyName = "Acme" } };
        var service = CreateApplicationService(targetJob, new List<Application>(), out var applications, out _);
        Application? saved = null;
        applications.Setup(a => a.AddAsync(It.IsAny<Application>()))
            .Callback<Application>(application => saved = application)
            .Returns(Task.CompletedTask);

        await service.ApplyAsync(5, new ApplicationCreateRequest { JobId = 20, ResumeId = 3, AcceptedPolicies = true });

        Assert.NotNull(saved);
        Assert.NotNull(saved!.AcceptedPoliciesAt);
    }

    [Fact]
    public async Task UpdateApplicationStatusAsync_Hired_RemembersWhenItWasDecided()
    {
        var job = new Job { JobId = 20, RecruiterId = 1, Title = "Frontend developer", Recruiter = new Recruiter { RecruiterId = 1, CompanyName = "Acme" } };
        var service = CreateApplicationService(job, new List<Application>(), out var applications, out _);
        var stored = new Application { ApplicationId = 30, JobId = 20, CandidateId = 1, StatusId = 1, AppliedAt = DateTime.UtcNow.AddDays(-5) };
        applications.Setup(a => a.GetByIdAsync(30)).ReturnsAsync(stored);

        await service.UpdateApplicationStatusAsync(9, 30, "Hired");

        Assert.NotNull(stored.DecidedAt);
    }

    [Fact]
    public async Task UpdateApplicationStatusAsync_MovedBackToAnOpenStatus_ClearsTheDecisionDate()
    {
        var job = new Job { JobId = 20, RecruiterId = 1, Title = "Frontend developer", Recruiter = new Recruiter { RecruiterId = 1, CompanyName = "Acme" } };
        var service = CreateApplicationService(job, new List<Application>(), out var applications, out _);
        var stored = new Application { ApplicationId = 30, JobId = 20, CandidateId = 1, StatusId = 6, DecidedAt = DateTime.UtcNow.AddDays(-1) };
        applications.Setup(a => a.GetByIdAsync(30)).ReturnsAsync(stored);

        await service.UpdateApplicationStatusAsync(9, 30, "Shortlisted");

        Assert.Null(stored.DecidedAt);
    }

    [Fact]
    public async Task CreateJobAsync_SavesTheRulesTheRecruiterChose()
    {
        var jobs = new Mock<IJobRepository>();
        var recruiters = new Mock<IRecruiterRepository>();
        recruiters.Setup(r => r.GetByUserIdAsync(9)).ReturnsAsync(new Recruiter { RecruiterId = 4, UserId = 9, CompanyName = "Acme" });
        Job? saved = null;
        jobs.Setup(j => j.AddAsync(It.IsAny<Job>()))
            .Callback<Job>(job => saved = job)
            .Returns(Task.CompletedTask);
        jobs.Setup(j => j.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Job?)null);
        var service = new JobService(jobs.Object, recruiters.Object);

        var response = await service.CreateJobAsync(9, new JobCreateRequest
        {
            Title = "Backend developer",
            Description = "Build the APIs.",
            ExclusiveApplication = true,
            HireLockMonths = 12,
            HireLockScope = "Platform",
            RejectWaitDays = 90,
            ResponseDeadlineDays = 7,
            AcceptedPolicies = true
        });

        Assert.NotNull(saved);
        Assert.True(saved!.ExclusiveApplication);
        Assert.Equal(12, saved.HireLockMonths);
        Assert.Equal("Platform", saved.HireLockScope);
        Assert.Equal(90, saved.RejectWaitDays);
        Assert.Equal(7, saved.ResponseDeadlineDays);
        Assert.NotNull(saved.PoliciesAcceptedAt);
        Assert.Equal(12, response.HireLockMonths);
    }

    private static bool IsValid(object model) =>
        Validator.TryValidateObject(model, new ValidationContext(model), new List<ValidationResult>(), validateAllProperties: true);

    private static JobCreateRequest GoodJob() => new JobCreateRequest
    {
        Title = "Backend developer",
        Description = "Build the APIs.",
        AcceptedPolicies = true
    };

    [Fact]
    public void JobRequest_WithTheRulesConfirmed_IsValid()
    {
        Assert.True(IsValid(GoodJob()));
    }

    [Fact]
    public void JobRequest_WithoutTheRulesConfirmed_IsNotValid()
    {
        var job = GoodJob();
        job.AcceptedPolicies = false;
        Assert.False(IsValid(job));
    }

    [Fact]
    public void JobRequest_WithAnImpossibleHireLock_IsNotValid()
    {
        var job = GoodJob();
        job.HireLockMonths = 61;
        Assert.False(IsValid(job));
    }

    [Fact]
    public void JobRequest_WithAnUnknownHireLockScope_IsNotValid()
    {
        var job = GoodJob();
        job.HireLockScope = "Everyone";
        Assert.False(IsValid(job));
    }

    [Fact]
    public void ApplicationRequest_WithoutAcceptingTheRules_IsNotValid()
    {
        Assert.False(IsValid(new ApplicationCreateRequest { JobId = 20, ResumeId = 3, AcceptedPolicies = false }));
        Assert.True(IsValid(new ApplicationCreateRequest { JobId = 20, ResumeId = 3, AcceptedPolicies = true }));
    }
}
