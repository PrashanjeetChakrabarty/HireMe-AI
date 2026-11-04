using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class JobRepository : IJobRepository
{
    private readonly ApplicationDbContext _context;

    public JobRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Job job)
    {
        await _context.Jobs.AddAsync(job);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Job>> GetAllAsync() =>
        await _context.Jobs
            .Include(j => j.Recruiter)
            .Where(j => j.Status == "Open")
            .OrderByDescending(j => j.PostedAt)
            .ToListAsync();

    public async Task<Job?> GetByIdAsync(int jobId) =>
        await _context.Jobs
            .Include(j => j.Recruiter)
            .FirstOrDefaultAsync(j => j.JobId == jobId);

    public async Task<List<Job>> GetByRecruiterIdAsync(int recruiterId) =>
        await _context.Jobs
            .Include(j => j.Recruiter)
            .Where(j => j.RecruiterId == recruiterId)
            .OrderByDescending(j => j.PostedAt)
            .ToListAsync();

    public async Task UpdateAsync(Job job)
    {
        _context.Jobs.Update(job);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int jobId)
    {
        var job = await _context.Jobs.FindAsync(jobId);
        if (job != null)
        {
            var relatedApplications = await _context.Applications
                .Where(a => a.JobId == jobId)
                .ToListAsync();
            _context.Applications.RemoveRange(relatedApplications);

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
        }
    }
}