namespace BackendAPI.Core.Services;

public interface IJwtTokenService
{
    string GenerateToken(int userId, string email, string roleName);
}