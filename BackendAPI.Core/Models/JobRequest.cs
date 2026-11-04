using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class JobCreateRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 150 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    public string Description { get; set; } = string.Empty;

    public string? Location { get; set; }

    // ---- Application rules for this job ----
    public bool ExclusiveApplication { get; set; }

    [Range(0, 60, ErrorMessage = "The hire lock must be between 0 and 60 months.")]
    public int HireLockMonths { get; set; }

    [RegularExpression("^(Recruiter|Platform)$", ErrorMessage = "The hire lock scope must be Recruiter or Platform.")]
    public string HireLockScope { get; set; } = "Recruiter";

    [Range(0, 365, ErrorMessage = "The wait after a rejection must be between 0 and 365 days.")]
    public int RejectWaitDays { get; set; }

    [Range(1, 90, ErrorMessage = "The reply deadline must be between 1 and 90 days.")]
    public int ResponseDeadlineDays { get; set; } = 14;

    [MustBeTrue(ErrorMessage = "You must confirm the application rules before posting a job.")]
    public bool AcceptedPolicies { get; set; }
}

public class JobUpdateRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 150 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    public string Description { get; set; } = string.Empty;

    public string? Location { get; set; }

    [Required(ErrorMessage = "Status is required.")]
    public string Status { get; set; } = "Open";
}