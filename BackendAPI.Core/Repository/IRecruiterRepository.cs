using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IRecruiterRepository
{
    Task AddAsync(Recruiter recruiter);
    Task<Recruiter?> GetByUserIdAsync(int userId);
}