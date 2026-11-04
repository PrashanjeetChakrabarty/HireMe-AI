using System;

namespace BackendAPI.Core.Models;

public class Application
{
    public int ApplicationId { get; set; }
    public int JobId { get; set; }
    public int CandidateId { get; set; }
    public int ResumeId { get; set; }
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public decimal? MatchScore { get; set; }
    public int? StatusId { get; set; }
    public DateTime? ShortlistedAt { get; set; }

    // When a recruiter hired or rejected the candidate. The hire lock and the wait after a rejection count from here.
    public DateTime? DecidedAt { get; set; }

    // When the candidate ticked "I accept the rules of this job".
    public DateTime? AcceptedPoliciesAt { get; set; }

    // Relationships
    public Job? Job { get; set; }
    public Candidate? Candidate { get; set; }
    public Resume? Resume { get; set; }
}