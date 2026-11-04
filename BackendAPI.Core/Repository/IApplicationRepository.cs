using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IApplicationRepository
{
    Task AddAsync(Application application);
    Task<bool> ExistsAsync(int jobId, int candidateId);
    Task<List<Application>> GetByCandidateIdAsync(int candidateId);
    Task<List<Application>> GetByJobIdAsync(int jobId);
    Task<Application?> GetByIdAsync(int applicationId);
    Task<bool> IsResumeAccessibleToRecruiterAsync(int resumeId, int recruiterId);
    Task UpdateAsync(Application application);
    Task DeleteAsync(int applicationId);
}