using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class AuthServiceConsentTests
{
    private static (AuthService service, Mock<IUserRepository> userRepo, Mock<IConsentService> consent) CreateService()
    {
        var userRepo = new Mock<IUserRepository>();
        var candidateRepo = new Mock<ICandidateRepository>();
        var recruiterRepo = new Mock<IRecruiterRepository>();
        var jwtService = new Mock<IJwtTokenService>();
        var emailService = new Mock<IEmailService>();
        var otpService = new Mock<IOtpService>();
        var consent = new Mock<IConsentService>();

        var configuration = new Mock<IConfiguration>();
        configuration.Setup(c => c["GoogleAuth:ClientId"]).Returns("test-client-id");
        var emptySection = new Mock<IConfigurationSection>();
        configuration.Setup(c => c.GetSection(It.IsAny<string>())).Returns(emptySection.Object);

        // No account exists yet, and the database gives the new account the id 7.
        userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        userRepo.Setup(r => r.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => user.UserId = 7)
            .Returns(Task.CompletedTask);

        var service = new AuthService(
            userRepo.Object,
            candidateRepo.Object,
            recruiterRepo.Object,
            jwtService.Object,
            emailService.Object,
            otpService.Object,
            configuration.Object,
            consent.Object);

        return (service, userRepo, consent);
    }

    [Fact]
    public async Task RegisterCandidateAsync_NewAccount_RecordsThatTheTermsWereAccepted()
    {
        var (service, _, consent) = CreateService();

        await service.RegisterCandidateAsync(new CandidateRegisterRequest
        {
            FullName = "Asha Rao",
            Email = "asha@example.com",
            Password = "Strong1!pass",
            Phone = "9876543210",
            AcceptedTerms = true
        });

        consent.Verify(c => c.RecordTermsAcceptedAsync(7), Times.Once);
    }

    [Fact]
    public async Task RegisterRecruiterAsync_NewAccount_RecordsThatTheTermsWereAccepted()
    {
        var (service, _, consent) = CreateService();

        await service.RegisterRecruiterAsync(new RecruiterRegisterRequest
        {
            FullName = "Ravi Kumar",
            Email = "ravi@example.com",
            Password = "Strong1!pass",
            CompanyName = "Acme",
            AcceptedTerms = true
        });

        consent.Verify(c => c.RecordTermsAcceptedAsync(7), Times.Once);
    }

    [Fact]
    public async Task RegisterCandidateAsync_UnverifiedAccountComesBack_DoesNotRecordASecondTime()
    {
        var (service, userRepo, consent) = CreateService();
        userRepo.Setup(r => r.GetByEmailAsync("again@example.com"))
            .ReturnsAsync(new User { UserId = 3, Email = "again@example.com", IsActive = false });

        await service.RegisterCandidateAsync(new CandidateRegisterRequest
        {
            FullName = "Asha Rao",
            Email = "again@example.com",
            Password = "Strong1!pass",
            Phone = "9876543210",
            AcceptedTerms = true
        });

        consent.Verify(c => c.RecordTermsAcceptedAsync(It.IsAny<int>()), Times.Never);
    }
}
