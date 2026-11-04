using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class ResumeRepository : IResumeRepository
{
    private readonly ApplicationDbContext _context;

    public ResumeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Resume resume)
    {
        await _context.Resumes.AddAsync(resume);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Resume>> GetByCandidateIdAsync(int candidateId) =>
        await _context.Resumes
            .Where(r => r.CandidateId == candidateId)
            .OrderByDescending(r => r.UploadedAt)
            .ToListAsync();

    public async Task<Resume?> GetByIdAsync(int resumeId) =>
        await _context.Resumes.FirstOrDefaultAsync(r => r.ResumeId == resumeId);

    public async Task DeleteAsync(int resumeId)
    {
        var resume = await _context.Resumes.FindAsync(resumeId);
        if (resume != null)
        {
            var relatedApplications = await _context.Applications
                .Where(a => a.ResumeId == resumeId)
                .ToListAsync();
            _context.Applications.RemoveRange(relatedApplications);

            _context.Resumes.Remove(resume);
            await _context.SaveChangesAsync();
        }
    }
}