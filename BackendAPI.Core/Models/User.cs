using System;

namespace BackendAPI.Core.Models;

public class User
{
    // Mirrors: UserId INT IDENTITY(1,1) PRIMARY KEY
    public int UserId { get; set; }

    // Mirrors: FullName NVARCHAR(150) NOT NULL
    public string FullName { get; set; } = string.Empty;

    // Mirrors: Email NVARCHAR(150) NOT NULL UNIQUE
    public string Email { get; set; } = string.Empty;

    // Mirrors: PasswordHash NVARCHAR(256) NOT NULL
    public string PasswordHash { get; set; } = string.Empty;

    // Mirrors: RoleId INT NOT NULL
    public int RoleId { get; set; }

    // Mirrors: CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Mirrors: IsActive BIT NOT NULL DEFAULT 1
    // Reused as the "email verified" flag: false until OTP is confirmed.
    public bool IsActive { get; set; } = true;

    // Mirrors: OtpCode NVARCHAR(6) NULL
    public string? OtpCode { get; set; }

    // Mirrors: OtpExpiry DATETIME2 NULL
    public DateTime? OtpExpiry { get; set; }

    // Navigation Property for Entity Framework Core relationship tracking
    public Role? Role { get; set; }
}