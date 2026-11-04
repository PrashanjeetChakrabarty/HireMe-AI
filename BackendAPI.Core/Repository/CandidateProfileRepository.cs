using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class CandidateProfileRepository : ICandidateProfileRepository
{
    private readonly ApplicationDbContext _context;

    public CandidateProfileRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddEducationAsync(int candidateId, List<EducationItem> educationItems)
    {
        if (educationItems == null || educationItems.Count == 0)
        {
            return;
        }

        foreach (var item in educationItems)
        {
            // Skip entries where the AI returned nothing useful at all
            if (string.IsNullOrWhiteSpace(item.Degree) && string.IsNullOrWhiteSpace(item.Institution))
            {
                continue;
            }

            _context.CandidateEducations.Add(new CandidateEducation
            {
                CandidateId = candidateId,
                Degree = item.Degree,
                Institution = item.Institution,
                Year = item.Year
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task AddWorkExperienceAsync(int candidateId, List<WorkExperienceItem> workExperienceItems)
    {
        if (workExperienceItems == null || workExperienceItems.Count == 0)
        {
            return;
        }

        foreach (var item in workExperienceItems)
        {
            // Skip entries where the AI returned nothing useful at all
            if (string.IsNullOrWhiteSpace(item.Company) && string.IsNullOrWhiteSpace(item.Role))
            {
                continue;
            }

            _context.CandidateWorkExperiences.Add(new CandidateWorkExperience
            {
                CandidateId = candidateId,
                Company = item.Company,
                Role = item.Role,
                Duration = item.Duration
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<CandidateEducation>> GetEducationByCandidateIdAsync(int candidateId) =>
        await _context.CandidateEducations
            .Where(e => e.CandidateId == candidateId)
            .ToListAsync();

    public async Task<List<CandidateWorkExperience>> GetWorkExperienceByCandidateIdAsync(int candidateId) =>
        await _context.CandidateWorkExperiences
            .Where(w => w.CandidateId == candidateId)
            .ToListAsync();
}