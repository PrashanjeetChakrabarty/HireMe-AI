using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface ICandidateProfileRepository
{
    Task AddEducationAsync(int candidateId, List<EducationItem> educationItems);
    Task AddWorkExperienceAsync(int candidateId, List<WorkExperienceItem> workExperienceItems);
    Task<List<CandidateEducation>> GetEducationByCandidateIdAsync(int candidateId);
    Task<List<CandidateWorkExperience>> GetWorkExperienceByCandidateIdAsync(int candidateId);
}