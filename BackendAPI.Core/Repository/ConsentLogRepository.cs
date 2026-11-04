using System;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class ConsentLogRepository : IConsentLogRepository
{
    private readonly ApplicationDbContext _context;

    public ConsentLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ConsentLog entry)
    {
        await _context.ConsentLogs.AddAsync(entry);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsForVisitorAsync(string visitorId, string consentType, string version) =>
        await _context.ConsentLogs.AnyAsync(c => c.VisitorId == visitorId && c.ConsentType == consentType && c.Version == version);

    public async Task<int> CountSinceAsync(string consentType, DateTime since) =>
        await _context.ConsentLogs.CountAsync(c => c.ConsentType == consentType && c.AcceptedAt >= since);
}
