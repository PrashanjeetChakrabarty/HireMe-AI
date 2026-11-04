using System;

namespace BackendAPI.Core.Models;

public class UserResponse
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty; // Navigation property se nikalenge
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}