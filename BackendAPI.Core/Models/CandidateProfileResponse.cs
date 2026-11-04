namespace BackendAPI.Core.Models;

public class CandidateProfileResponse
{
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public List<CandidateEducation> Education { get; set; } = new();
    public List<CandidateWorkExperience> WorkExperience { get; set; } = new();
}
