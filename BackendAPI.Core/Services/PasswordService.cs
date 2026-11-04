using System;
using System.Threading.Tasks;
using BackendAPI.Core.Repository;

namespace BackendAPI.Core.Services;

public class PasswordService : IPasswordService
{
    private readonly IUserRepository _userRepository;
    private readonly IOtpService _otpService;
    private readonly IEmailService _emailService;

    public PasswordService(IUserRepository userRepository, IOtpService otpService, IEmailService emailService)
    {
        _userRepository = userRepository;
        _otpService = otpService;
        _emailService = emailService;
    }

    public async Task SendCodeAsync(int userId)
    {
        _ = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Account not found.");

        await _otpService.GenerateAndSendOtpAsync(userId);
    }

    public async Task ChangeAsync(int userId, string otpCode, string newPassword)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Account not found.");

        var isValidOtp = await _otpService.VerifyOtpAsync(user.Email, otpCode);
        if (!isValidOtp)
        {
            throw new InvalidOperationException("Invalid or expired verification code.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _userRepository.UpdateAsync(user);

        // Tell the owner, so a change they did not make is noticed. A problem with this email never undoes the change.
        try
        {
            var message = NotificationEmails.PasswordChanged(user.FullName);
            await _emailService.SendEmailAsync(user.Email, message.Subject, message.Body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Password changed email failed: {ex.Message}");
        }
    }
}
