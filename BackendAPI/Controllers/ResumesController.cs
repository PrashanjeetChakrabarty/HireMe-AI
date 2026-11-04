using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResumesController : ControllerBase
{
    private readonly IResumeService _resumeService;

    public ResumesController(IResumeService resumeService)
    {
        _resumeService = resumeService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string GetUserRole() =>
        User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    // 1. UPLOAD RESUME -> 200 OK, 403 Forbidden, or 400 Bad Request
    [HttpPost("upload/{userId}")]
    public async Task<IActionResult> Upload(int userId, IFormFile file)
    {
        // Sirf apna hi resume upload karna allowed hai
        if (userId != GetUserId())
        {
            return Forbid();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        try
        {
            var resume = await _resumeService.UploadResumeAsync(userId, file);
            return Ok(resume);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 2. GET CANDIDATE'S RESUMES -> 200 OK or 403 Forbidden
    [HttpGet("candidate/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        // Sirf apni hi resumes ki list dekhna allowed hai
        if (userId != GetUserId())
        {
            return Forbid();
        }

        try
        {
            var resumes = await _resumeService.GetResumesByUserIdAsync(userId);
            return Ok(resumes);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 3. DOWNLOAD RESUME -> File, 403 Forbidden, or 404 Not Found
    [HttpGet("download/{resumeId}")]
    public async Task<IActionResult> Download(int resumeId)
    {
        try
        {
            var result = await _resumeService.DownloadResumeAsync(resumeId, GetUserId(), GetUserRole());
            if (result == null)
            {
                return NotFound(new { message = $"Resume with ID {resumeId} was not found." });
            }

            var extension = Path.GetExtension(result.Value.fileName).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };

            return File(result.Value.fileBytes, contentType, result.Value.fileName);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // 4. DELETE RESUME -> 200 OK, 403 Forbidden, or 404 Not Found
    [HttpDelete("{resumeId}")]
    public async Task<IActionResult> Delete(int resumeId)
    {
        try
        {
            var deleted = await _resumeService.DeleteResumeAsync(resumeId, GetUserId());
            if (!deleted)
            {
                return NotFound(new { message = $"Resume with ID {resumeId} was not found." });
            }

            return Ok(new { message = "Resume deleted successfully." });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}