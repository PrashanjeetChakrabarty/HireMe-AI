using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class ForgotPasswordRequest
{
    [Required]
    public string Email { get; set; } = string.Empty;

    // The answer from the Turnstile "I am human" check on the website. Only needed once the server has a secret key.
    public string? TurnstileToken { get; set; }
}