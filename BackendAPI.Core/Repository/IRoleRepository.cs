using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IRoleRepository
{
    Task<IEnumerable<Role>> GetRegisterableRolesAsync();
}