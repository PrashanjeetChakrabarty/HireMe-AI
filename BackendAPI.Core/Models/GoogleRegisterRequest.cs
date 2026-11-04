namespace BackendAPI.Core.Models;

public class GoogleRegisterRequest
{
    public string IdToken { get; set; } = string.Empty;

    // "candidate" or "recruiter"
    public string Role { get; set; } = "candidate";

    // Only used when Role is "candidate"
    public string? Phone { get; set; }

    // Only used when Role is "recruiter"
    public string? CompanyName { get; set; }

    [MustBeTrue(ErrorMessage = "You must accept the Terms of Service and the Privacy Policy.")]
    public bool AcceptedTerms { get; set; }
}