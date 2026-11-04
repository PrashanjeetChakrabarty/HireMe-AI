using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IJobService
{
    Task<JobResponse> CreateJobAsync(int userId, JobCreateRequest request);
    Task<List<JobResponse>> GetOpenJobsAsync();
    Task<List<JobResponse>> GetMyJobsAsync(int userId);
    Task<JobResponse?> GetJobByIdAsync(int jobId);
    Task<bool> UpdateJobAsync(int userId, int jobId, JobUpdateRequest request);
    Task<bool> DeleteJobAsync(int userId, int jobId);
}