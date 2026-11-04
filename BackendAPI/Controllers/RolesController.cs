using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendAPI.Core.Services;

namespace BackendAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet("register-options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRegisterOptions()
    {
        var roles = await _roleService.GetRegisterableRolesAsync();
        return Ok(roles);
    }
}