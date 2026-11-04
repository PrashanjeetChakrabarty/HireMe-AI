namespace BackendAPI.Core.Models;

public class ActivityFeedEntryResponse
{
    public string CandidateName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? Summary { get; set; }
}