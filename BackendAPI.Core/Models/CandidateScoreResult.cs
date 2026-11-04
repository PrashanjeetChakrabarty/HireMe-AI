using System.Text.Json.Serialization;

namespace BackendAPI.Core.Models;

public class CandidateScoreResult
{
    [JsonPropertyName("resumeFileName")]
    public string? ResumeFileName { get; set; }

    [JsonPropertyName("skillsInResume")]
    public List<string> SkillsInResume { get; set; } = new();

    [JsonPropertyName("skillsInJob")]
    public List<string> SkillsInJob { get; set; } = new();

    [JsonPropertyName("matchedSkillPairs")]
    public List<MatchedSkillPair> MatchedSkillPairs { get; set; } = new();

    [JsonPropertyName("skillMatchPercentage")]
    public double SkillMatchPercentage { get; set; }

    [JsonPropertyName("jobMatchPercentage")]
    public double JobMatchPercentage { get; set; }

    [JsonPropertyName("finalScore")]
    public double FinalScore { get; set; }
}

public class MatchedSkillPair
{
    [JsonPropertyName("jobSkill")]
    public string? JobSkill { get; set; }

    [JsonPropertyName("matchedResumeSkill")]
    public string? MatchedResumeSkill { get; set; }

    [JsonPropertyName("similarity")]
    public double Similarity { get; set; }
}