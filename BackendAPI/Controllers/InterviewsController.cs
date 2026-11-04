using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterviewsController : ControllerBase
{
    private readonly IInterviewService _interviewService;

    public InterviewsController(IInterviewService interviewService)
    {
        _interviewService = interviewService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 1. RECRUITER schedules an interview for an application -> 200 OK
    [HttpPost]
    public async Task<IActionResult> ScheduleInterview([FromBody] ScheduleInterviewRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var interview = await _interviewService.ScheduleInterviewAsync(GetUserId(), request);
            return Ok(interview);
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

    // 2. RECRUITER updates status and/or adds comments -> 200 OK
    [HttpPut("{interviewId}")]
    public async Task<IActionResult> UpdateInterview(int interviewId, [FromBody] UpdateInterviewRequest request)
    {
        try
        {
            var interview = await _interviewService.UpdateInterviewAsync(GetUserId(), interviewId, request);
            return Ok(interview);
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

    // 3. CANDIDATE views their own interviews -> 200 OK
    [HttpGet("my-interviews")]
    public async Task<IActionResult> GetMyInterviews()
    {
        try
        {
            var interviews = await _interviewService.GetMyInterviewsAsync(GetUserId());
            return Ok(interviews);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 4. RECRUITER views all interviews across their own jobs -> 200 OK
    [HttpGet]
    public async Task<IActionResult> GetRecruiterInterviews()
    {
        try
        {
            var interviews = await _interviewService.GetInterviewsForRecruiterAsync(GetUserId());
            return Ok(interviews);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}