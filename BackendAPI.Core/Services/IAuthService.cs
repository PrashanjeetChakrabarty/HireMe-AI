using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<GoogleLoginResult?> GoogleLoginAsync(string idToken);
    Task<LoginResponse?> CompleteGoogleRegistrationAsync(GoogleRegisterRequest request);
    Task<RegisterResponse> RegisterCandidateAsync(CandidateRegisterRequest request);
    Task<RegisterResponse> RegisterRecruiterAsync(RecruiterRegisterRequest request);
    Task<LoginResponse?> GenerateTokenForVerifiedUserAsync(string email);
    Task ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string email, string otpCode, string newPassword);
    Task<bool> IsAccountUnverifiedAsync(string email);
    Task<bool> DoesAccountExistAsync(string email);
}