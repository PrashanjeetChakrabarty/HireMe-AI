using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class DeleteAccountRequest
{
    [Required]
    public string OtpCode { get; set; } = string.Empty;
}