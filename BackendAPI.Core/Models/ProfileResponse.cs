namespace BackendAPI.Core.Models;

public class ProfileResponse
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
}