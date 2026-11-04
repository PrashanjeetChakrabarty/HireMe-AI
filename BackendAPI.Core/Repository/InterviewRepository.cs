using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class InterviewRepository : IInterviewRepository
{
    private readonly ApplicationDbContext _context;

    public InterviewRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Interview interview)
    {
        await _context.Interviews.AddAsync(interview);
        await _context.SaveChangesAsync();
    }

    public async Task<Interview?> GetByIdAsync(int interviewId) =>
        await _context.Interviews
            .Include(i => i.Application!)
                .ThenInclude(a => a.Candidate!)
                    .ThenInclude(c => c.User)
            .Include(i => i.Application!)
                .ThenInclude(a => a.Job)
            .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

    // One application should only ever have one interview record, so this
    // finds it by the ApplicationId instead of a separate InterviewId.
    public async Task<Interview?> GetByApplicationIdAsync(int applicationId) =>
        await _context.Interviews
            .FirstOrDefaultAsync(i => i.ApplicationId == applicationId);

    public async Task<List<Interview>> GetByCandidateIdAsync(int candidateId) =>
        await _context.Interviews
            .Include(i => i.Application!)
                .ThenInclude(a => a.Job!)
                    .ThenInclude(j => j.Recruiter)
            .Where(i => i.Application != null && i.Application.CandidateId == candidateId)
            .OrderByDescending(i => i.ScheduledAt)
            .ToListAsync();

    public async Task<List<Interview>> GetByRecruiterIdAsync(int recruiterId) =>
        await _context.Interviews
            .Include(i => i.Application!)
                .ThenInclude(a => a.Candidate!)
                    .ThenInclude(c => c.User)
            .Include(i => i.Application!)
                .ThenInclude(a => a.Job)
            .Where(i => i.Application != null && i.Application.Job != null && i.Application.Job.RecruiterId == recruiterId)
            .OrderByDescending(i => i.ScheduledAt)
            .ToListAsync();

    public async Task UpdateAsync(Interview interview)
    {
        _context.Interviews.Update(interview);
        await _context.SaveChangesAsync();
    }
}