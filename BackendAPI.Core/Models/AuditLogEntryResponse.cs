namespace BackendAPI.Core.Models;

public class AuditLogEntryResponse
{
    public string Action { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? Summary { get; set; }
}