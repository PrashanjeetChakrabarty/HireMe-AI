using System.Security.Claims;
using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers;

// Changing your own password. Both calls act on the logged in person only.
[ApiController]
[Route("api/Users/me")]
[Authorize]
public class PasswordController : ControllerBase
{
    private readonly IPasswordService _passwordService;

    public PasswordController(IPasswordService passwordService)
    {
        _passwordService = passwordService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Sends a code to the person's own email -> 200 OK, or 404 Not Found
    [HttpPost("password-code")]
    public async Task<IActionResult> SendCode()
    {
        try
        {
            await _passwordService.SendCodeAsync(GetUserId());
            return Ok(new { message = "A verification code has been sent to your email." });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // Saves the new password after checking the code -> 200 OK, or 400 Bad Request
    [HttpPut("password")]
    public async Task<IActionResult> Change([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _passwordService.ChangeAsync(GetUserId(), request.OtpCode, request.NewPassword);
            return Ok(new { message = "Password changed successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
