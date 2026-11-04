using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class RecruiterRepository : IRecruiterRepository
{
    private readonly ApplicationDbContext _context;

    public RecruiterRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Recruiter recruiter)
    {
        await _context.Recruiters.AddAsync(recruiter);
        await _context.SaveChangesAsync();
    }

    public async Task<Recruiter?> GetByUserIdAsync(int userId) =>
        await _context.Recruiters.FirstOrDefaultAsync(r => r.UserId == userId);
}