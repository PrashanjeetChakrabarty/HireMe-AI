using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface ICandidateRepository
{
    Task AddAsync(Candidate candidate);
    Task<Candidate?> GetByUserIdAsync(int userId);
    Task UpdateAsync(Candidate candidate);
}