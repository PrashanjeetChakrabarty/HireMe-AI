using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class ApplicationRepository : IApplicationRepository
{
    private readonly ApplicationDbContext _context;

    public ApplicationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Application application)
    {
        await _context.Applications.AddAsync(application);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int jobId, int candidateId) =>
        await _context.Applications
            .AnyAsync(a => a.JobId == jobId && a.CandidateId == candidateId);

    public async Task<List<Application>> GetByCandidateIdAsync(int candidateId) =>
        await _context.Applications
            .Include(a => a.Job!)
                .ThenInclude(j => j.Recruiter)
            .Include(a => a.Resume)
            .Where(a => a.CandidateId == candidateId)
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();

    public async Task<List<Application>> GetByJobIdAsync(int jobId) =>
        await _context.Applications
            .Include(a => a.Candidate!)
                .ThenInclude(c => c.User)
            .Include(a => a.Resume)
            .Where(a => a.JobId == jobId)
            .OrderByDescending(a => a.MatchScore ?? -1)
            .ThenByDescending(a => a.AppliedAt)
            .ToListAsync();

    public async Task<Application?> GetByIdAsync(int applicationId) =>
        await _context.Applications
            .Include(a => a.Candidate!)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);

    public async Task<bool> IsResumeAccessibleToRecruiterAsync(int resumeId, int recruiterId) =>
        await _context.Applications
            .Include(a => a.Job)
            .AnyAsync(a => a.ResumeId == resumeId && a.Job != null && a.Job.RecruiterId == recruiterId);

    public async Task UpdateAsync(Application application)
    {
        _context.Applications.Update(application);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int applicationId)
    {
        var application = await _context.Applications.FindAsync(applicationId);
        if (application != null)
        {
            // Interviews cascade-delete automatically (FK_Interviews_Applications
            // has ON DELETE CASCADE), so removing the Application is enough here.
            _context.Applications.Remove(application);
            await _context.SaveChangesAsync();
        }
    }
}