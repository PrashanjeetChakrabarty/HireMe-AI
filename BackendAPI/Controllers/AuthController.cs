using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IOtpService _otpService;
    private readonly IRateLimitService _rateLimitService;
    private readonly ITurnstileService? _turnstileService;

    public AuthController(IAuthService authService, IOtpService otpService, IRateLimitService rateLimitService, ITurnstileService? turnstileService = null)
    {
        _authService = authService;
        _otpService = otpService;
        _rateLimitService = rateLimitService;
        _turnstileService = turnstileService;
    }

    // The "I am human" check from Cloudflare Turnstile. It does nothing until the secret key is set on the server.
    private async Task<bool> PassesHumanCheckAsync(string? token)
    {
        if (_turnstileService == null)
        {
            return true;
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        return await _turnstileService.VerifyAsync(token, ip);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!await PassesHumanCheckAsync(request.TurnstileToken))
        {
            return BadRequest(new { message = "Please complete the human check and try again." });
        }

        var (allowed, secondsRemaining) = _rateLimitService.CheckLogin(request.Email);
        if (!allowed)
        {
            return StatusCode(429, new { message = $"Too many attempts. Please wait {secondsRemaining} seconds before trying again." });
        }

        // Validates email + password. Returns null on any failure (wrong
        // password, unverified account, or account not found).
        var validated = await _authService.LoginAsync(request);

        if (validated == null)
        {
            var accountExists = await _authService.DoesAccountExistAsync(request.Email);
            if (!accountExists)
            {
                return Unauthorized(new { message = "No account found with this email. Please register first.", accountNotFound = true });
            }

            var isUnverified = await _authService.IsAccountUnverifiedAsync(request.Email);
            if (isUnverified)
            {
                return Unauthorized(new { message = "Please verify your email before logging in.", needsVerification = true, email = request.Email });
            }

            // Account exists and is verified — this was a genuine wrong password.
            _rateLimitService.RecordFailedLogin(request.Email);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        // Successful login — clear any prior failed-attempt count.
        _rateLimitService.ResetLogin(request.Email);

        // Credentials are correct — email verification already happened at
        // registration time, so log the user in directly. No OTP step here.
        return Ok(validated);
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        var result = await _authService.GoogleLoginAsync(request.IdToken);

        if (result == null)
        {
            return Unauthorized(new { message = "Invalid Google token." });
        }

        return Ok(result);
    }

    [HttpPost("google-register")]
    public async Task<IActionResult> GoogleRegister([FromBody] GoogleRegisterRequest request)
    {
        var result = await _authService.CompleteGoogleRegistrationAsync(request);

        if (result == null)
        {
            return Unauthorized(new { message = "Invalid Google token." });
        }

        return Ok(result);
    }

    [HttpPost("register/candidate")]
    public async Task<IActionResult> RegisterCandidate([FromBody] CandidateRegisterRequest request)
    {
        if (!await PassesHumanCheckAsync(request.TurnstileToken))
        {
            return BadRequest(new { message = "Please complete the human check and try again." });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (allowed, secondsRemaining) = _rateLimitService.CheckRegister(ip, request.Email);
        if (!allowed)
        {
            return StatusCode(429, new { message = $"Too many attempts. Please wait {secondsRemaining} seconds before trying again." });
        }
        _rateLimitService.RecordRegisterAttempt(ip, request.Email);

        try
        {
            var result = await _authService.RegisterCandidateAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("register/recruiter")]
    public async Task<IActionResult> RegisterRecruiter([FromBody] RecruiterRegisterRequest request)
    {
        if (!await PassesHumanCheckAsync(request.TurnstileToken))
        {
            return BadRequest(new { message = "Please complete the human check and try again." });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (allowed, secondsRemaining) = _rateLimitService.CheckRegister(ip, request.Email);
        if (!allowed)
        {
            return StatusCode(429, new { message = $"Too many attempts. Please wait {secondsRemaining} seconds before trying again." });
        }
        _rateLimitService.RecordRegisterAttempt(ip, request.Email);

        try
        {
            var result = await _authService.RegisterRecruiterAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Used only for registration verification now.
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] OtpVerifyRequest request)
    {
        var isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode);
        if (!isValid)
        {
            return BadRequest(new { message = "Invalid or expired verification code." });
        }

        var loginResponse = await _authService.GenerateTokenForVerifiedUserAsync(request.Email);
        return Ok(loginResponse);
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ForgotPasswordRequest request)
    {
        if (!await PassesHumanCheckAsync(request.TurnstileToken))
        {
            return BadRequest(new { message = "Please complete the human check and try again." });
        }

        // Only unverified accounts (mid-registration) ever need this now.
        var isUnverified = await _authService.IsAccountUnverifiedAsync(request.Email);
        if (!isUnverified)
        {
            return BadRequest(new { message = "This account is already verified or does not exist." });
        }

        await _otpService.ResendOtpAsync(request.Email);
        return Ok(new { message = "A new verification code has been sent." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!await PassesHumanCheckAsync(request.TurnstileToken))
        {
            return BadRequest(new { message = "Please complete the human check and try again." });
        }

        await _authService.ForgotPasswordAsync(request.Email);
        return Ok(new { message = "If an account with that email exists, a reset code has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var success = await _authService.ResetPasswordAsync(request.Email, request.OtpCode, request.NewPassword);
        if (!success)
        {
            return BadRequest(new { message = "Invalid or expired code." });
        }

        return Ok(new { message = "Password reset successfully. You can now log in." });
    }
}