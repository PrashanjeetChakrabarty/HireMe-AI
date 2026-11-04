using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class ApplicationCreateRequest
{
    [Required(ErrorMessage = "JobId is required.")]
    public int JobId { get; set; }

    [Required(ErrorMessage = "ResumeId is required.")]
    public int ResumeId { get; set; }

    [MustBeTrue(ErrorMessage = "You must accept the application rules of this job before applying.")]
    public bool AcceptedPolicies { get; set; }
}