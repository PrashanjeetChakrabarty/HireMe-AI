using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IResumeRepository
{
    Task AddAsync(Resume resume);
    Task<List<Resume>> GetByCandidateIdAsync(int candidateId);
    Task<Resume?> GetByIdAsync(int resumeId);
    Task DeleteAsync(int resumeId);
}