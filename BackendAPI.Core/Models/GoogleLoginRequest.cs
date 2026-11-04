namespace BackendAPI.Core.Models;

public class GoogleLoginRequest
{
    // This is the "ID token" that Google gives to the frontend when
    // the user picks their Google account. The backend will verify
    // this with Google to confirm it's genuine.
    public string IdToken { get; set; } = string.Empty;
}