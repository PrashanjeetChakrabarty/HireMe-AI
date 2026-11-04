using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "The verification code is required.")]
    public string OtpCode { get; set; } = string.Empty;

    // Same rule as sign up.
    [Required(ErrorMessage = "The new password is required.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?"":{}|<>]).{8,}$",
        ErrorMessage = "Password must be at least 8 characters and include a capital letter, a number, and a special character.")]
    public string NewPassword { get; set; } = string.Empty;
}
