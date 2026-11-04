using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IJobRepository
{
    Task AddAsync(Job job);
    Task<List<Job>> GetAllAsync();
    Task<Job?> GetByIdAsync(int jobId);
    Task<List<Job>> GetByRecruiterIdAsync(int recruiterId);
    Task UpdateAsync(Job job);
    Task DeleteAsync(int jobId);
}