using System;

namespace BackendAPI.Core.Models;

public class Resume
{
    public int ResumeId { get; set; }
    public int CandidateId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ParsedText { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Relationships
    public Candidate? Candidate { get; set; }
}