using System.Text.Json.Serialization;

namespace BackendAPI.Core.Models;

public class ResumeAnalysisResult
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("skills")]
    public List<string> Skills { get; set; } = new();

    [JsonPropertyName("workExperience")]
    public List<WorkExperienceItem> WorkExperience { get; set; } = new();

    [JsonPropertyName("education")]
    public List<EducationItem> Education { get; set; } = new();

    [JsonPropertyName("certifications")]
    public List<string> Certifications { get; set; } = new();

    [JsonPropertyName("projects")]
    public List<ProjectItem> Projects { get; set; } = new();

    [JsonPropertyName("summary")]
    public string? Summary { get; set; }
}

public class WorkExperienceItem
{
    [JsonPropertyName("company")]
    public string? Company { get; set; }

    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("duration")]
    public string? Duration { get; set; }
}

public class EducationItem
{
    [JsonPropertyName("degree")]
    public string? Degree { get; set; }

    [JsonPropertyName("institution")]
    public string? Institution { get; set; }

    [JsonPropertyName("year")]
    public string? Year { get; set; }
}

public class ProjectItem
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}