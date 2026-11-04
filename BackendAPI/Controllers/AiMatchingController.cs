using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendAPI.Core.Services;
using System.Threading.Tasks;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiMatchingController : ControllerBase
{
    private readonly IAiMatchingService _matchingService;

    public AiMatchingController(IAiMatchingService matchingService)
    {
        _matchingService = matchingService;
    }

    // GET: api/AiMatching/match-score/5
    [HttpGet("match-score/{applicationId}")]
    public async Task<IActionResult> GetMatchScore(int applicationId)
    {
        try
        {
            var result = await _matchingService.ProcessApplicationScoringAsync(applicationId);
            return Ok(result);
        }
        catch (System.ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (System.Collections.Generic.KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (System.Exception ex)
        {
            return Problem(ex.Message);
        }
    }

    // GET: api/AiMatching/dashboard-report
    [HttpGet("dashboard-report")]
    public async Task<IActionResult> GetDashboardReport()
    {
        try
        {
            var report = await _matchingService.RetrieveRecruiterAnalyticsAsync();
            return Ok(report);
        }
        catch (System.Exception ex)
        {
            return Problem(ex.Message);
        }
    }

    // GET: api/AiMatching/global-matches
    [HttpGet("global-matches")]
    public async Task<IActionResult> GetGlobalMatches()
    {
        try
        {
            var matches = await _matchingService.RetrieveGlobalCompatibilityReportAsync();
            return Ok(matches);
        }
        catch (System.Exception ex)
        {
            return Problem(ex.Message);
        }
    }
}