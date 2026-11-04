using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class CandidateRegisterRequest
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Enter a valid email address, e.g. name@example.com")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?"":{}|<>]).{8,}$", ErrorMessage = "Password must be at least 8 characters and include a capital letter, a number, and a special character.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone is required.")]
    [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit phone number.")]
    public string? Phone { get; set; }

    public string? Address { get; set; }

    [MustBeTrue(ErrorMessage = "You must accept the Terms of Service and the Privacy Policy.")]
    public bool AcceptedTerms { get; set; }

    // The answer from the Turnstile "I am human" check on the website. Only needed once the server has a secret key.
    public string? TurnstileToken { get; set; }
}