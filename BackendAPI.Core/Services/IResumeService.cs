using BackendAPI.Core.Models;
using Microsoft.AspNetCore.Http;

namespace BackendAPI.Core.Services;

public interface IResumeService
{
    Task<ResumeResponse> UploadResumeAsync(int userId, IFormFile file);
    Task<List<ResumeResponse>> GetResumesByUserIdAsync(int userId);
    Task<(byte[] fileBytes, string fileName)?> DownloadResumeAsync(int resumeId, int requestingUserId, string requestingUserRole);Task<bool> DeleteResumeAsync(int resumeId, int requestingUserId);
}