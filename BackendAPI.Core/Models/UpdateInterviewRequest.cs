namespace BackendAPI.Core.Models;

public class UpdateInterviewRequest
{
    // Optional — only sent if the recruiter wants to change the status.
    // Must be one of: Scheduled, Completed, Rejected, Hired.
    public string? Status { get; set; }

    // Optional — only sent if the recruiter wants to add/update comments.
    public string? RecruiterComments { get; set; }

    // Optional — only sent if the recruiter wants to change the venue
    // (address / meeting link / phone number, depending on Mode).
    public string? Venue { get; set; }
}