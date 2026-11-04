using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class ResetPasswordRequest
{
    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string OtpCode { get; set; } = string.Empty;

    [Required]
    public string NewPassword { get; set; } = string.Empty;
}