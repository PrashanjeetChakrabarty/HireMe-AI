using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class InterviewStatusRepository : IInterviewStatusRepository
{
    private readonly ApplicationDbContext _context;

    public InterviewStatusRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int?> GetIdByNameAsync(string statusName)
    {
        var status = await _context.InterviewStatuses
            .FirstOrDefaultAsync(s => s.StatusName.ToLower() == statusName.ToLower());
        return status?.StatusId;
    }

    public async Task<Dictionary<int, string>> GetAllAsDictionaryAsync()
    {
        var statuses = await _context.InterviewStatuses.ToListAsync();
        return statuses.ToDictionary(s => s.StatusId, s => s.StatusName);
    }
}