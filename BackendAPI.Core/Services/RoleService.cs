using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<RoleResponse>> GetRegisterableRolesAsync()
    {
        var roles = await _roleRepository.GetRegisterableRolesAsync();

        return roles.Select(r => new RoleResponse
        {
            RoleId = r.RoleId,
            RoleName = r.RoleName
        });
    }
}