using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IApplicationService
{
    Task<ApplicationResponse> ApplyAsync(int userId, ApplicationCreateRequest request);
    Task<List<ApplicationResponse>> GetMyApplicationsAsync(int userId);
    Task<List<ApplicationResponse>> GetApplicantsForJobAsync(int userId, int jobId);
    Task<CandidateProfileResponse> GetCandidateProfileAsync(int userId, int applicationId);
    Task<ApplicationResponse> UpdateApplicationStatusAsync(int userId, int applicationId, string status);
    Task<List<AuditLogEntryResponse>> GetActivityLogAsync(int userId, int applicationId);
    Task<List<ActivityFeedEntryResponse>> GetRecruiterActivityFeedAsync(int userId);
    Task<List<ActivityFeedEntryResponse>> GetCandidateActivityFeedAsync(int userId);
}