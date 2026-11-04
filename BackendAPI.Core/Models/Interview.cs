using System;

namespace BackendAPI.Core.Models;

public class Interview
{
    public int InterviewId { get; set; }
    public int ApplicationId { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public string? Mode { get; set; }
    public string? Venue { get; set; }
    public string? RecruiterComments { get; set; }
    public int StatusId { get; set; }

    // Relationships
    public Application? Application { get; set; }
}