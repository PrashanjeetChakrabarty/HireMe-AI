using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IInterviewRepository
{
    Task AddAsync(Interview interview);
    Task<Interview?> GetByIdAsync(int interviewId);
    Task<Interview?> GetByApplicationIdAsync(int applicationId);
    Task<List<Interview>> GetByCandidateIdAsync(int candidateId);
    Task<List<Interview>> GetByRecruiterIdAsync(int recruiterId);
    Task UpdateAsync(Interview interview);
}