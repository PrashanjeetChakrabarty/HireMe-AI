using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IRoleService
{
    Task<IEnumerable<RoleResponse>> GetRegisterableRolesAsync();
}