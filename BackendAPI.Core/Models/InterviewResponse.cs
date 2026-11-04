using System;

namespace BackendAPI.Core.Models;

public class InterviewResponse
{
    public int InterviewId { get; set; }
    public int ApplicationId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public DateTime? ScheduledAt { get; set; }
    public string? Mode { get; set; }
    public string? Venue { get; set; }
    public string? RecruiterComments { get; set; }
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
}