namespace BackendAPI.Core.Models;

public class Role
{
    // Mirrors: RoleId INT IDENTITY(1,1) PRIMARY KEY
    public int RoleId { get; set; }

    // Mirrors: RoleName NVARCHAR(50) NOT NULL UNIQUE
    public string RoleName { get; set; } = string.Empty;
}