using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

public class ApplicationStatusUpdateRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}