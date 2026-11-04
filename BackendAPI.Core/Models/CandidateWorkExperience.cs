namespace BackendAPI.Core.Models;

public class CandidateWorkExperience
{
    public int WorkExperienceId { get; set; }
    public int CandidateId { get; set; }
    public string? Company { get; set; }
    public string? Role { get; set; }
    public string? Duration { get; set; }
}