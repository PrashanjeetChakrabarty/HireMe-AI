using System;
using System.Collections.Generic;

namespace BackendAPI.Core.Models;

public class Job
{
    public int JobId { get; set; }
    public int RecruiterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime PostedAt { get; set; } = DateTime.UtcNow;

    // The rules the recruiter chose when posting. They are not editable later, so what a candidate accepted stays true.
    public bool ExclusiveApplication { get; set; }
    public int HireLockMonths { get; set; }
    public string HireLockScope { get; set; } = "Recruiter";
    public int RejectWaitDays { get; set; }
    public int ResponseDeadlineDays { get; set; } = 14;
    public DateTime? PoliciesAcceptedAt { get; set; }

    // Relationships
    public Recruiter? Recruiter { get; set; }
    public ICollection<Skill> RequiredSkills { get; set; } = new List<Skill>();
}