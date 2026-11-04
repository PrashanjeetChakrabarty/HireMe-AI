using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface ISkillRepository
{
    Task AddSkillsToCandidateAsync(int candidateId, List<string> skillNames);
    Task<List<string>> GetSkillsByCandidateIdAsync(int candidateId);
}