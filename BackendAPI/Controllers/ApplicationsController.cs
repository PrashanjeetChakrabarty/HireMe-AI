using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;

    public ApplicationsController(IApplicationService applicationService)
    {
        _applicationService = applicationService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Apply([FromBody] ApplicationCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var application = await _applicationService.ApplyAsync(GetUserId(), request);
            return Ok(application);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-applications")]
    public async Task<IActionResult> GetMyApplications()
    {
        try
        {
            var applications = await _applicationService.GetMyApplicationsAsync(GetUserId());
            return Ok(applications);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("job/{jobId}")]
    public async Task<IActionResult> GetApplicantsForJob(int jobId)
    {
        try
        {
            var applications = await _applicationService.GetApplicantsForJobAsync(GetUserId(), jobId);
            return Ok(applications);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{applicationId}/candidate-profile")]
    public async Task<IActionResult> GetCandidateProfile(int applicationId)
    {
        try
        {
            var profile = await _applicationService.GetCandidateProfileAsync(GetUserId(), applicationId);
            return Ok(profile);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{applicationId}/status")]
    public async Task<IActionResult> UpdateStatus(int applicationId, [FromBody] ApplicationStatusUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated = await _applicationService.UpdateApplicationStatusAsync(GetUserId(), applicationId, request.Status);
            return Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{applicationId}/activity-log")]
    public async Task<IActionResult> GetActivityLog(int applicationId)
    {
        try
        {
            var log = await _applicationService.GetActivityLogAsync(GetUserId(), applicationId);
            return Ok(log);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 7. RECRUITER'S FULL ACTIVITY FEED (all their jobs' applications combined) -> 200 OK
    [HttpGet("activity-feed")]
    public async Task<IActionResult> GetActivityFeed()
    {
        try
        {
            var feed = await _applicationService.GetRecruiterActivityFeedAsync(GetUserId());
            return Ok(feed);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 8. CANDIDATE'S FULL ACTIVITY FEED (all their applications, across companies, combined) -> 200 OK
    [HttpGet("my-activity-feed")]
    public async Task<IActionResult> GetMyActivityFeed()
    {
        try
        {
            var feed = await _applicationService.GetCandidateActivityFeedAsync(GetUserId());
            return Ok(feed);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}