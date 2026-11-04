using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace BackendAPI.Core.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;
    private readonly IOtpService _otpService;
    private readonly IConfiguration _configuration;
    private readonly IConsentService? _consentService;

    public AuthService(
        IUserRepository userRepository,
        ICandidateRepository candidateRepository,
        IRecruiterRepository recruiterRepository,
        IJwtTokenService jwtTokenService,
        IEmailService emailService,
        IOtpService otpService,
        IConfiguration configuration,
        IConsentService? consentService = null)
    {
        _userRepository = userRepository;
        _candidateRepository = candidateRepository;
        _recruiterRepository = recruiterRepository;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
        _otpService = otpService;
        _configuration = configuration;
        _consentService = consentService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !user.IsActive) return null;

        bool passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!passwordValid) return null;

        return MapToResponse(user);
    }

    public async Task<GoogleLoginResult?> GoogleLoginAsync(string idToken)
    {
        GoogleJsonWebSignature.Payload payload;

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["GoogleAuth:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException)
        {
            return null;
        }

        var user = await _userRepository.GetByEmailAsync(payload.Email);

        if (user == null)
        {
            // Brand-new Google user — don't create the account yet.
            // Ask the frontend to let them pick Candidate or Recruiter first.
            return new GoogleLoginResult
            {
                RequiresRoleSelection = true,
                Email = payload.Email,
                FullName = payload.Name ?? payload.Email
            };
        }

        if (!user.IsActive)
        {
            // Account existed but was never OTP-verified — Google login counts as verification.
            user.IsActive = true;
            await _userRepository.UpdateAsync(user);
        }

        return new GoogleLoginResult
        {
            RequiresRoleSelection = false,
            LoginResponse = MapToResponse(user)
        };
    }

    // Sends an email without ever failing the action that caused it (the account is already created or changed).
    private async Task SendNotificationAsync(string toEmail, NotificationMessage message)
    {
        try
        {
            await _emailService.SendEmailAsync(toEmail, message.Subject, message.Body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Notification email failed: {ex.Message}");
        }
    }

    public async Task<LoginResponse?> CompleteGoogleRegistrationAsync(GoogleRegisterRequest request)
    {
        GoogleJsonWebSignature.Payload payload;

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["GoogleAuth:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (InvalidJwtException)
        {
            return null;
        }

        // Safety net: if the account somehow already exists (e.g. the
        // person double-clicked), just log them in instead of erroring.
        var existingUser = await _userRepository.GetByEmailAsync(payload.Email);
        if (existingUser != null)
        {
            if (!existingUser.IsActive)
            {
                existingUser.IsActive = true;
                await _userRepository.UpdateAsync(existingUser);
            }
            return MapToResponse(existingUser);
        }

        var isRecruiter = request.Role?.ToLower() == "recruiter";

        var user = new User
        {
            FullName = payload.Name ?? payload.Email,
            Email = payload.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            RoleId = isRecruiter ? 2 : 1,
            CreatedAt = DateTime.UtcNow,
            IsActive = true // Google already verified the email
        };
        await _userRepository.AddAsync(user);

        if (isRecruiter)
        {
            var recruiter = new Recruiter
            {
                UserId = user.UserId,
                CompanyName = request.CompanyName ?? ""
            };
            await _recruiterRepository.AddAsync(recruiter);
        }
        else
        {
            var candidate = new Candidate
            {
                UserId = user.UserId,
                Phone = request.Phone
            };
            await _candidateRepository.AddAsync(candidate);
        }

        await RecordTermsAcceptedAsync(user.UserId);

        await SendNotificationAsync(user.Email, NotificationEmails.Welcome(user.FullName, isRecruiter ? "Recruiter" : "Candidate"));

        return MapToResponse(user);
    }

    public async Task<bool> IsAccountUnverifiedAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        return user != null && !user.IsActive;
    }

    public async Task<bool> DoesAccountExistAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        return user != null;
    }

    public async Task<RegisterResponse> RegisterCandidateAsync(CandidateRegisterRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);

        if (existingUser != null)
        {
            if (existingUser.IsActive)
            {
                // Fully verified account — this really is a duplicate.
                throw new InvalidOperationException("An account with this email already exists.");
            }

            // Unverified account from a previous, abandoned registration —
            // doesn't count as "existing" yet. Just resend the OTP so the
            // person can pick up where they left off.
            await _otpService.GenerateAndSendOtpAsync(existingUser.UserId);
            return new RegisterResponse { Email = existingUser.Email };
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = 1, // Candidate
            CreatedAt = DateTime.UtcNow,
            IsActive = false // Not verified yet — OTP required
        };
        await _userRepository.AddAsync(user);

        var candidate = new Candidate
        {
            UserId = user.UserId,
            Phone = request.Phone,
            Address = request.Address
        };
        await _candidateRepository.AddAsync(candidate);

        await RecordTermsAcceptedAsync(user.UserId);

        await _otpService.GenerateAndSendOtpAsync(user.UserId);

        return new RegisterResponse { Email = user.Email };
    }

    public async Task<RegisterResponse> RegisterRecruiterAsync(RecruiterRegisterRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);

        if (existingUser != null)
        {
            if (existingUser.IsActive)
            {
                throw new InvalidOperationException("An account with this email already exists.");
            }

            await _otpService.GenerateAndSendOtpAsync(existingUser.UserId);
            return new RegisterResponse { Email = existingUser.Email };
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = 2, // Recruiter
            CreatedAt = DateTime.UtcNow,
            IsActive = false // Not verified yet — OTP required
        };
        await _userRepository.AddAsync(user);

        var recruiter = new Recruiter
        {
            UserId = user.UserId,
            CompanyName = request.CompanyName,
            CompanyWebsite = request.CompanyWebsite
        };
        await _recruiterRepository.AddAsync(recruiter);

        await RecordTermsAcceptedAsync(user.UserId);

        await _otpService.GenerateAndSendOtpAsync(user.UserId);

        return new RegisterResponse { Email = user.Email };
    }

    public async Task<LoginResponse?> GenerateTokenForVerifiedUserAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null || !user.IsActive) return null;

        return MapToResponse(user);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null)
        {
            return;
        }

        await _otpService.GenerateAndSendOtpAsync(user.UserId);
    }

    public async Task<bool> ResetPasswordAsync(string email, string otpCode, string newPassword)
    {
        var isValidOtp = await _otpService.VerifyOtpAsync(email, otpCode);
        if (!isValidOtp)
        {
            return false;
        }

        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return false;
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _userRepository.UpdateAsync(user);

        // Tell the owner that the password changed, so a change they did not make is noticed.
        await SendNotificationAsync(user.Email, NotificationEmails.PasswordChanged(user.FullName));

        return true;
    }

    // The API only creates an account after the Terms of Service and the Privacy Policy were accepted,
    // so every new account gets one record of that.
    private async Task RecordTermsAcceptedAsync(int userId)
    {
        if (_consentService != null)
        {
            await _consentService.RecordTermsAcceptedAsync(userId);
        }
    }

    private LoginResponse MapToResponse(User user)
    {
        var roleName = user.Role?.RoleName ?? (user.RoleId == 1 ? "Candidate" : user.RoleId == 2 ? "Recruiter" : "User");

        return new LoginResponse
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = roleName,
            Token = _jwtTokenService.GenerateToken(user.UserId, user.Email, roleName)
        };
    }
}