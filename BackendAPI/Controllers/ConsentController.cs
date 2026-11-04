using System;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConsentController : ControllerBase
{
    private readonly IConsentService _consentService;

    public ConsentController(IConsentService consentService)
    {
        _consentService = consentService;
    }

    // Called when a visitor presses OK on the browser storage notice. Nobody is logged in at that point,
    // so only a random id that the browser made for itself is saved. No IP address, name or email.
    [HttpPost("notice")]
    public async Task<IActionResult> RecordNotice([FromBody] ConsentNoticeRequest request)
    {
        if (!Guid.TryParse(request.VisitorId, out var visitorId))
        {
            return BadRequest(new { message = "The visitor id is not valid." });
        }

        var recorded = await _consentService.RecordStorageNoticeAsync(visitorId.ToString("N"));
        if (!recorded)
        {
            return StatusCode(429, new { message = "Too many requests. Please try again later." });
        }

        return NoContent();
    }
}
