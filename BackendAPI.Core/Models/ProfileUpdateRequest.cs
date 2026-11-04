namespace BackendAPI.Core.Models;

public class ProfileUpdateRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
}
