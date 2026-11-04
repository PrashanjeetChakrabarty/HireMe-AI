namespace BackendAPI.Core.Models;

// Returned when a Google token is verified. If the account already
// existed, LoginResponse is filled in and the user is logged in.
// If this is a brand-new Google user, RequiresRoleSelection is true
// and the frontend should ask "Candidate or Recruiter?" before
// calling google-register to actually create the account.
public class GoogleLoginResult
{
    public bool RequiresRoleSelection { get; set; }
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public LoginResponse? LoginResponse { get; set; }
}