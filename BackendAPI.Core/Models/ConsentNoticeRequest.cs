namespace BackendAPI.Core.Models;

public class ConsentNoticeRequest
{
    // A random id (a GUID) that the browser made for itself.
    public string VisitorId { get; set; } = string.Empty;
}
