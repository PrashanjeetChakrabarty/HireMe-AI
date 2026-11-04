using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class RoleRepository : IRoleRepository
{
    private readonly ApplicationDbContext _context;

    public RoleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Role>> GetRegisterableRolesAsync()
    {
        return await _context.Roles
            .Where(r => r.RoleName == "Candidate" || r.RoleName == "Recruiter")
            .ToListAsync();
    }
}