namespace BackendAPI.Core.Models;

public class CandidateEducation
{
    public int EducationId { get; set; }
    public int CandidateId { get; set; }
    public string? Degree { get; set; }
    public string? Institution { get; set; }
    public string? Year { get; set; }
}