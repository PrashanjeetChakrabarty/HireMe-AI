namespace BackendAPI.Core.Models;

public class ApplicationResponse
{
    public int ApplicationId { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public int ResumeId { get; set; }
    public string ResumeFileName { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; }
    public decimal? MatchScore { get; set; }
    public int? StatusId { get; set; }
    public string StatusName { get; set; } = "Applied";
    public DateTime? ShortlistedAt { get; set; }
}