using BackendAPI.Core.Models;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobsController : ControllerBase
{
    private readonly IJobService _jobService;

    public JobsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 1. CREATE JOB (Recruiter) -> 200 OK or 400 Bad Request
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JobCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var job = await _jobService.CreateJobAsync(GetUserId(), request);
            return Ok(job);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 2. BROWSE OPEN JOBS (Candidate) -> 200 OK
    [HttpGet]
    public async Task<IActionResult> GetOpenJobs()
    {
        var jobs = await _jobService.GetOpenJobsAsync();
        return Ok(jobs);
    }

    // 3. MY JOBS (Recruiter) -> 200 OK
    [HttpGet("my-jobs")]
    public async Task<IActionResult> GetMyJobs()
    {
        try
        {
            var jobs = await _jobService.GetMyJobsAsync(GetUserId());
            return Ok(jobs);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 4. GET JOB BY ID -> 200 OK or 404 Not Found
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var job = await _jobService.GetJobByIdAsync(id);
        if (job == null)
        {
            return NotFound(new { message = $"Job with ID {id} was not found." });
        }
        return Ok(job);
    }

    // 5. UPDATE JOB (Recruiter, own jobs only) -> 200 OK or 404 Not Found
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] JobUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var success = await _jobService.UpdateJobAsync(GetUserId(), id, request);
            if (!success)
            {
                return NotFound(new { message = $"Cannot update. Job with ID {id} does not exist or is not yours." });
            }
            return Ok(new { message = "Job updated successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 6. DELETE JOB (Recruiter, own jobs only) -> 200 OK or 404 Not Found
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _jobService.DeleteJobAsync(GetUserId(), id);
            if (!success)
            {
                return NotFound(new { message = $"Cannot delete. Job with ID {id} does not exist or is not yours." });
            }
            return Ok(new { message = "Job deleted successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}