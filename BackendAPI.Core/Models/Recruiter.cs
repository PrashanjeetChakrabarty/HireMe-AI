namespace BackendAPI.Core.Models;

public class Recruiter
{
    public int RecruiterId { get; set; }
    public int UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyWebsite { get; set; }

    // Relationships
    public User? User { get; set; }
}