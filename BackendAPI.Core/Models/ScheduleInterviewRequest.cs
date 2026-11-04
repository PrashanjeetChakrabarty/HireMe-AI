using System;
using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class ScheduleInterviewRequest
{
    [Required]
    public int ApplicationId { get; set; }

    [Required]
    public DateTime ScheduledAt { get; set; }

    // Expected values: "Online", "In-person", "Phone"
    [Required]
    public string Mode { get; set; } = string.Empty;

    // Meaning depends on Mode: a physical address for In-person, a meeting
    // link for Online, or a phone number for Phone. Optional either way.
    public string? Venue { get; set; }
}