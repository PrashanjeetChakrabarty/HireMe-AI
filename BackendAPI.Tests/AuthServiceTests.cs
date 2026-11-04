using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class AuthServiceTests
{
    // Helper: AuthService banane ke liye 7 fake (mock) dependencies chahiye
    // hoti hain — is method mein sab ek saath set up kar dete hain taaki
    // har test mein baar-baar likhna na pade.
    private static (AuthService service, Mock<IUserRepository> userRepo, Mock<IJwtTokenService> jwtService)
        CreateService()
    {
        var userRepo = new Mock<IUserRepository>();
        var candidateRepo = new Mock<ICandidateRepository>();
        var recruiterRepo = new Mock<IRecruiterRepository>();
        var jwtService = new Mock<IJwtTokenService>();
        var emailService = new Mock<IEmailService>();
        var otpService = new Mock<IOtpService>();

        // AuthService also reads app settings (for example the Google client id),
        // so it gets a fake IConfiguration.
        var configuration = new Mock<IConfiguration>();
        configuration.Setup(c => c["GoogleAuth:ClientId"]).Returns("test-client-id");
        var emptySection = new Mock<IConfigurationSection>();
        configuration.Setup(c => c.GetSection(It.IsAny<string>())).Returns(emptySection.Object);

        var service = new AuthService(
            userRepo.Object,
            candidateRepo.Object,
            recruiterRepo.Object,
            jwtService.Object,
            emailService.Object,
            otpService.Object,
            configuration.Object);

        return (service, userRepo, jwtService);
    }

    [Fact]
    public async Task LoginAsync_UserNotFound_ReturnsNull()
    {
        var (service, userRepo, _) = CreateService();

        // Jab bhi koi email database mein dhunda jaye, mock bolta hai "koi user nahi mila".
        userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "doesnotexist@example.com",
            Password = "AnyPassword1!"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_UnverifiedAccount_ReturnsNull()
    {
        var (service, userRepo, _) = CreateService();

        var fakeUser = new User
        {
            UserId = 1,
            Email = "unverified@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPass1!"),
            IsActive = false, // OTP verify nahi hui abhi
            RoleId = 1
        };

        userRepo.Setup(r => r.GetByEmailAsync("unverified@example.com"))
            .ReturnsAsync(fakeUser);

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "unverified@example.com",
            Password = "CorrectPass1!"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        var (service, userRepo, _) = CreateService();

        var fakeUser = new User
        {
            UserId = 1,
            Email = "user@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPass1!"),
            IsActive = true,
            RoleId = 1
        };

        userRepo.Setup(r => r.GetByEmailAsync("user@example.com"))
            .ReturnsAsync(fakeUser);

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "user@example.com",
            Password = "WrongPassword!"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_CorrectCredentials_ReturnsTokenAndUserDetails()
    {
        var (service, userRepo, jwtService) = CreateService();

        var fakeUser = new User
        {
            UserId = 42,
            FullName = "Test Candidate",
            Email = "test.candidate@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPass1!"),
            IsActive = true,
            RoleId = 1,
            Role = new Role { RoleId = 1, RoleName = "Candidate" }
        };

        userRepo.Setup(r => r.GetByEmailAsync("test.candidate@example.com"))
            .ReturnsAsync(fakeUser);

        // JWT service ko fake token dene ke liye bol dete hain — hum real
        // JWT generate nahi karna chahte, sirf ye check karna hai ki
        // AuthService use call karta hai aur response mein daalta hai.
        jwtService.Setup(j => j.GenerateToken(42, "test.candidate@example.com", "Candidate"))
            .Returns("fake-jwt-token");

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "test.candidate@example.com",
            Password = "CorrectPass1!"
        });

        Assert.NotNull(result);
        Assert.Equal(42, result!.UserId);
        Assert.Equal("Test Candidate", result.FullName);
        Assert.Equal("Candidate", result.RoleName);
        Assert.Equal("fake-jwt-token", result.Token);
    }
}