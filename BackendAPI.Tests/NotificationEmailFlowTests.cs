using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class NotificationEmailFlowTests
{
    // ---- Welcome email, sent from the OTP check ----

    private static (OtpService service, Mock<IEmailService> email, User user) CreateOtpService(bool alreadyActive)
    {
        var user = new User
        {
            UserId = 5,
            FullName = "Asha Rao",
            Email = "asha@example.test",
            IsActive = alreadyActive,
            OtpCode = "123456",
            OtpExpiry = DateTime.UtcNow.AddMinutes(5)
        };
        var users = new Mock<IUserRepository>();
        users.Setup(u => u.GetByEmailAsync("asha@example.test")).ReturnsAsync(user);
        users.Setup(u => u.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        var email = new Mock<IEmailService>();
        return (new OtpService(users.Object, email.Object), email, user);
    }

    [Fact]
    public async Task VerifyOtpAsync_ForANewAccount_SendsTheWelcomeEmailOnce()
    {
        var (service, email, _) = CreateOtpService(alreadyActive: false);

        var verified = await service.VerifyOtpAsync("asha@example.test", "123456");

        Assert.True(verified);
        email.Verify(e => e.SendEmailAsync("asha@example.test", "Welcome to HireMe AI", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_ForAnAlreadyActiveAccount_DoesNotWelcomeAgain()
    {
        var (service, email, _) = CreateOtpService(alreadyActive: true);

        var verified = await service.VerifyOtpAsync("asha@example.test", "123456");

        Assert.True(verified);
        email.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithAWrongCode_SendsNothing()
    {
        var (service, email, _) = CreateOtpService(alreadyActive: false);

        var verified = await service.VerifyOtpAsync("asha@example.test", "000000");

        Assert.False(verified);
        email.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    // ---- Confirmation when an account is deleted ----

    [Fact]
    public async Task DeleteOwnAccountAsync_ConfirmsTheDeletionByEmail()
    {
        var user = new User { UserId = 5, FullName = "Asha Rao", Email = "asha@example.test" };
        var users = new Mock<IUserRepository>();
        users.Setup(u => u.GetByIdAsync(5)).ReturnsAsync(user);
        users.Setup(u => u.DeleteAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        var otp = new Mock<IOtpService>();
        otp.Setup(o => o.VerifyOtpAsync("asha@example.test", "123456")).ReturnsAsync(true);
        var email = new Mock<IEmailService>();
        var service = new UserService(
            users.Object,
            new Mock<ICandidateRepository>().Object,
            new Mock<IRecruiterRepository>().Object,
            new Mock<IApplicationRepository>().Object,
            new Mock<IJobRepository>().Object,
            new Mock<IResumeRepository>().Object,
            otp.Object,
            email.Object);

        var deleted = await service.DeleteOwnAccountAsync(5, "123456");

        Assert.True(deleted);
        email.Verify(e => e.SendEmailAsync("asha@example.test", "Your HireMe AI account has been deleted", It.IsAny<string>()), Times.Once);
    }

    // ---- "Your job is live", sent to the recruiter ----

    [Fact]
    public async Task CreateJobAsync_TellsTheRecruiterTheJobIsLive()
    {
        var jobs = new Mock<IJobRepository>();
        var recruiters = new Mock<IRecruiterRepository>();
        var users = new Mock<IUserRepository>();
        var email = new Mock<IEmailService>();
        recruiters.Setup(r => r.GetByUserIdAsync(9)).ReturnsAsync(new Recruiter { RecruiterId = 4, UserId = 9, CompanyName = "Acme" });
        users.Setup(u => u.GetByIdAsync(9)).ReturnsAsync(new User { UserId = 9, FullName = "Ravi", Email = "ravi@example.test" });
        jobs.Setup(j => j.AddAsync(It.IsAny<Job>())).Returns(Task.CompletedTask);
        jobs.Setup(j => j.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Job?)null);
        var service = new JobService(jobs.Object, recruiters.Object, users.Object, email.Object);

        await service.CreateJobAsync(9, new JobCreateRequest
        {
            Title = "Backend developer",
            Description = "Build the APIs.",
            AcceptedPolicies = true
        });

        email.Verify(e => e.SendEmailAsync("ravi@example.test", It.Is<string>(s => s.Contains("Backend developer")), It.IsAny<string>()), Times.Once);
    }

    // ---- "New applicant", sent to the recruiter ----

    [Fact]
    public async Task ApplyAsync_TellsTheRecruiterAboutTheNewApplicant()
    {
        var recruiter = new Recruiter { RecruiterId = 1, UserId = 9, CompanyName = "Acme" };
        var job = new Job { JobId = 20, RecruiterId = 1, Title = "Frontend developer", Recruiter = recruiter };
        var applications = new Mock<IApplicationRepository>();
        var candidates = new Mock<ICandidateRepository>();
        var jobs = new Mock<IJobRepository>();
        var resumes = new Mock<IResumeRepository>();
        var statuses = new Mock<IInterviewStatusRepository>();
        var users = new Mock<IUserRepository>();
        var email = new Mock<IEmailService>();

        candidates.Setup(c => c.GetByUserIdAsync(5)).ReturnsAsync(new Candidate { CandidateId = 1, UserId = 5 });
        jobs.Setup(j => j.GetByIdAsync(20)).ReturnsAsync(job);
        resumes.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(new Resume { ResumeId = 3, CandidateId = 1, FileName = "cv.pdf", FilePath = "/nowhere/cv.pdf" });
        applications.Setup(a => a.ExistsAsync(20, 1)).ReturnsAsync(false);
        applications.Setup(a => a.GetByCandidateIdAsync(1)).ReturnsAsync(new List<Application>());
        applications.Setup(a => a.AddAsync(It.IsAny<Application>())).Returns(Task.CompletedTask);
        statuses.Setup(s => s.GetIdByNameAsync("Applied")).ReturnsAsync((int?)1);
        statuses.Setup(s => s.GetAllAsDictionaryAsync()).ReturnsAsync(new Dictionary<int, string> { [1] = "Applied" });
        users.Setup(u => u.GetByIdAsync(5)).ReturnsAsync(new User { UserId = 5, FullName = "Asha Rao", Email = "asha@example.test" });
        users.Setup(u => u.GetByIdAsync(9)).ReturnsAsync(new User { UserId = 9, FullName = "Ravi", Email = "ravi@example.test" });

        var service = new ApplicationService(
            applications.Object,
            candidates.Object,
            new Mock<IRecruiterRepository>().Object,
            jobs.Object,
            resumes.Object,
            new Mock<IAiServiceClient>().Object,
            new Mock<ISkillRepository>().Object,
            new Mock<ICandidateProfileRepository>().Object,
            statuses.Object,
            new Mock<IAuditLogRepository>().Object,
            users.Object,
            email.Object);

        await service.ApplyAsync(5, new ApplicationCreateRequest { JobId = 20, ResumeId = 3, AcceptedPolicies = true });

        email.Verify(e => e.SendEmailAsync("ravi@example.test", "New applicant for Frontend developer", It.Is<string>(b => b.Contains("Asha Rao"))), Times.Once);
        email.Verify(e => e.SendEmailAsync("asha@example.test", It.Is<string>(s => s.StartsWith("Application Submitted")), It.IsAny<string>()), Times.Once);
    }
}
