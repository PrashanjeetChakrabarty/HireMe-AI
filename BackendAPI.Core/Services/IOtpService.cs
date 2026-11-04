namespace BackendAPI.Core.Services;

public interface IOtpService
{
    Task GenerateAndSendOtpAsync(int userId);
    Task<bool> VerifyOtpAsync(string email, string otpCode);
    Task ResendOtpAsync(string email);
}