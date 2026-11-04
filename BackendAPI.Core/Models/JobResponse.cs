namespace BackendAPI.Core.Models;

public class JobResponse
{
    public int JobId { get; set; }
    public int RecruiterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PostedAt { get; set; }
    public string? CompanyName { get; set; }

    public bool ExclusiveApplication { get; set; }
    public int HireLockMonths { get; set; }
    public string HireLockScope { get; set; } = "Recruiter";
    public int RejectWaitDays { get; set; }
    public int ResponseDeadlineDays { get; set; } = 14;
}