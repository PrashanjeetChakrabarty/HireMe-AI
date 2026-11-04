namespace BackendAPI.Core.Models;

public class RegisterResponse
{
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = "Registration successful. Please check your email for the verification code.";
}