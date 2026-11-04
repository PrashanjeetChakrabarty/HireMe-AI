using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IOtpService _otpService;

    public UsersController(IUserService userService, IOtpService otpService)
    {
        _userService = userService;
        _otpService = otpService;
    }

    // JWT token se current logged-in user ka ID nikalta hai — jaise
    // JobsController/ApplicationsController mein pehle se ho raha hai.
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Removed on purpose: list all users, get by id, create, update and delete by id.
    // The website does not use them, and some had no ownership check. Only profile and "me" endpoints remain.

    // 6. GET PROFILE -> 200 OK, 403 Forbidden, or 404 Not Found
    [HttpGet("profile/{id}")]
    public async Task<IActionResult> GetProfile(int id)
    {
        // only allow users to access their own data, unless they are an admin (roleId 1)
        if (id != GetUserId())
        {
            return Forbid();
        }

        var profile = await _userService.GetProfileAsync(id);
        if (profile == null)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }
        return Ok(profile);
    }

    // 7. UPDATE PROFILE -> 200 OK, 403 Forbidden, or 404 Not Found
    [HttpPut("profile/{id}")]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] ProfileUpdateRequest request)
    {
        // only allow users to update their own profile, unless they are an admin (roleId 1)
        if (id != GetUserId())
        {
            return Forbid();
        }

        var success = await _userService.UpdateProfileAsync(id, request);
        if (!success)
        {
            return NotFound(new { message = $"Cannot update. User with ID {id} does not exist." });
        }
        return Ok(new { message = "Profile updated successfully." });
    }

    // Sends an OTP to the logged-in user's own email, so they can
    // confirm account deletion without needing to know a password
    // (important for Google accounts, which never had a real one).
    [HttpPost("me/request-delete-otp")]
    public async Task<IActionResult> RequestDeleteOtp()
    {
        var userId = GetUserId();
        var profile = await _userService.GetProfileAsync(userId);
        if (profile == null)
        {
            return NotFound(new { message = "Account not found." });
        }

        await _otpService.GenerateAndSendOtpAsync(userId);
        return Ok(new { message = "A verification code has been sent to your email." });
    }

    // 8. DELETE MY OWN ACCOUNT (self-service, OTP confirm ke saath)
    // -> 200 OK (deleted), 400 Bad Request (invalid/expired OTP), 404 Not Found
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyAccount([FromBody] DeleteAccountRequest request)
    {
        var userId = GetUserId();

        try
        {
            var success = await _userService.DeleteOwnAccountAsync(userId, request.OtpCode);
            if (!success)
            {
                return NotFound(new { message = "Account not found." });
            }

            return Ok(new { message = "Account deleted successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}