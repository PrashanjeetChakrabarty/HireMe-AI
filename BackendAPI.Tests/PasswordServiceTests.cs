using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class PasswordServiceTests
{
    private static (PasswordService service, Mock<IUserRepository> users, Mock<IOtpService> otp, Mock<IEmailService> email, User user) Create()
    {
        var user = new User { UserId = 5, FullName = "Asha Rao", Email = "asha@example.test", PasswordHash = "old" };
        var users = new Mock<IUserRepository>();
        users.Setup(u => u.GetByIdAsync(5)).ReturnsAsync(user);
        users.Setup(u => u.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        var otp = new Mock<IOtpService>();
        otp.Setup(o => o.GenerateAndSendOtpAsync(5)).Returns(Task.CompletedTask);
        var email = new Mock<IEmailService>();
        return (new PasswordService(users.Object, otp.Object, email.Object), users, otp, email, user);
    }

    [Fact]
    public async Task SendCodeAsync_SendsACodeToThePerson()
    {
        var (service, _, otp, _, _) = Create();

        await service.SendCodeAsync(5);

        otp.Verify(o => o.GenerateAndSendOtpAsync(5), Times.Once);
    }

    [Fact]
    public async Task SendCodeAsync_ForAnUnknownAccount_Throws()
    {
        var (service, users, otp, _, _) = Create();
        users.Setup(u => u.GetByIdAsync(99)).ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<System.InvalidOperationException>(() => service.SendCodeAsync(99));

        otp.Verify(o => o.GenerateAndSendOtpAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ChangeAsync_WithTheRightCode_SavesTheNewPasswordAndTellsTheOwner()
    {
        var (service, users, otp, email, user) = Create();
        otp.Setup(o => o.VerifyOtpAsync("asha@example.test", "123456")).ReturnsAsync(true);

        await service.ChangeAsync(5, "123456", "Strong1!pass");

        Assert.True(BCrypt.Net.BCrypt.Verify("Strong1!pass", user.PasswordHash));
        users.Verify(u => u.UpdateAsync(user), Times.Once);
        email.Verify(e => e.SendEmailAsync("asha@example.test", "Your password was changed", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ChangeAsync_WithAWrongCode_ChangesNothing()
    {
        var (service, users, otp, email, user) = Create();
        otp.Setup(o => o.VerifyOtpAsync("asha@example.test", "000000")).ReturnsAsync(false);

        var error = await Assert.ThrowsAsync<System.InvalidOperationException>(() => service.ChangeAsync(5, "000000", "Strong1!pass"));

        Assert.Contains("Invalid or expired", error.Message);
        Assert.Equal("old", user.PasswordHash);
        users.Verify(u => u.UpdateAsync(It.IsAny<User>()), Times.Never);
        email.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    private static bool IsValid(ChangePasswordRequest request) =>
        Validator.TryValidateObject(request, new ValidationContext(request), new List<ValidationResult>(), validateAllProperties: true);

    [Fact]
    public void ChangePasswordRequest_WithAStrongPasswordAndACode_IsValid()
    {
        Assert.True(IsValid(new ChangePasswordRequest { OtpCode = "123456", NewPassword = "Strong1!pass" }));
    }

    [Fact]
    public void ChangePasswordRequest_WithAWeakPassword_IsNotValid()
    {
        Assert.False(IsValid(new ChangePasswordRequest { OtpCode = "123456", NewPassword = "weakpass" }));
    }

    [Fact]
    public void ChangePasswordRequest_WithoutACode_IsNotValid()
    {
        Assert.False(IsValid(new ChangePasswordRequest { OtpCode = "", NewPassword = "Strong1!pass" }));
    }
}
