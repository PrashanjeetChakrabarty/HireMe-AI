using BackendAPI.Core.Repository;

namespace BackendAPI.Core.Services;

public class OtpService : IOtpService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public OtpService(IUserRepository userRepository, IEmailService emailService)
    {
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task GenerateAndSendOtpAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("User not found.");

        await GenerateAndSendOtpForUserAsync(user);
    }

    public async Task ResendOtpAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email)
            ?? throw new InvalidOperationException("User not found.");

        await GenerateAndSendOtpForUserAsync(user);
    }

    public async Task<bool> VerifyOtpAsync(string email, string otpCode)
    {
        // Step 4: Database se fresh data laate hain, us user ka current
        // saved OTP nikaalte hain.
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null || user.OtpCode == null || user.OtpExpiry == null)
        {
            return false;
        }

        // Step 5: Database mein jo save hai, usी se compare karo — user ne
        // jo type kiya, wo hamesha DATABASE ke against check hota hai,
        // kabhi hardcoded ya cached value ke against nahi.
        if (user.OtpCode != otpCode || user.OtpExpiry < DateTime.UtcNow)
        {
            return false;
        }

        // Match ho gaya — verify successful, OTP ko "consume" kar do
        // (dobara use na ho sake).
        var isFirstActivation = !user.IsActive;
        user.IsActive = true;
        user.OtpCode = null;
        user.OtpExpiry = null;
        await _userRepository.UpdateAsync(user);

        // A brand new account is welcomed once. A code used for a password reset or an account deletion does not welcome again.
        if (isFirstActivation)
        {
            try
            {
                var welcome = NotificationEmails.Welcome(user.FullName, user.Role?.RoleName);
                await _emailService.SendEmailAsync(user.Email, welcome.Subject, welcome.Body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Welcome email failed: {ex.Message}");
            }
        }

        return true;
    }

    private async Task GenerateAndSendOtpForUserAsync(BackendAPI.Core.Models.User user)
    {
        // Fix: agar user ke paas already ek VALID (non-expired) OTP hai,
        // to naya generate mat karo — wahi purana reuse karo. Isसे agar
        // user ne "Resend" dobara dabaya, ya login/register dobara try
        // kiya, purana email jo unके paas already khula hai, wo invalid
        // NAHI hoga. Naya OTP sirf tab banta hai jab purana genuinely
        // expire ho chuka ho, ya kabhi bana hi na ho.
        var hasValidExistingOtp = user.OtpCode != null
            && user.OtpExpiry != null
            && user.OtpExpiry > DateTime.UtcNow;

        var otpCode = hasValidExistingOtp
            ? user.OtpCode!
            : new Random().Next(100000, 999999).ToString();

        // Step 1 & 2: Naya OTP generate karके, DATABASE mein store karo
        // (sirf tab jab genuinely naya banaya ho — agar reuse ho raha hai,
        // dobara save karne ki zaroorat nahi, DB mein already sahi value hai).
        if (!hasValidExistingOtp)
        {
            user.OtpCode = otpCode;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
            await _userRepository.UpdateAsync(user);
        }

        // Step 3: Database mein save hone ke BAAD, user ko email bhejo.
        await _emailService.SendEmailAsync(
            user.Email,
            "Your Verification Code",
            $"Hi {user.FullName},\n\nYour verification code is: {otpCode}\n\nThis code expires in 10 minutes.\n\nThanks,\nHireMe AI Team");
    }
}