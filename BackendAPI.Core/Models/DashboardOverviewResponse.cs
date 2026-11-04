namespace BackendAPI.Core.Models;

public class DashboardOverviewResponse
{
    // Widgets
    public int TotalCandidates { get; set; }
    public int ActiveJobs { get; set; }
    public int TotalApplicants { get; set; }
    public List<TopCandidateEntry> AiTopCandidates { get; set; } = new();
    public List<PipelineStageCount> InterviewPipeline { get; set; } = new();

    // Charts
    public List<SkillCountEntry> SkillDistribution { get; set; } = new();
    public List<PipelineStageCount> CandidateStatusBreakdown { get; set; } = new();
    public List<HiringTrendEntry> HiringAnalytics { get; set; } = new();
}

public class TopCandidateEntry
{
    public string CandidateName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public decimal MatchScore { get; set; }
}

public class PipelineStageCount
{
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class SkillCountEntry
{
    public string SkillName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class HiringTrendEntry
{
    public string Date { get; set; } = string.Empty;
    public int ApplicationCount { get; set; }
}