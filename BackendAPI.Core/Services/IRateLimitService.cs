namespace BackendAPI.Core.Services;

public interface IRateLimitService
{
    (bool allowed, int secondsRemaining) CheckLogin(string email);
    void RecordFailedLogin(string email);
    void ResetLogin(string email);

    (bool allowed, int secondsRemaining) CheckRegister(string ipAddress, string email);
    void RecordRegisterAttempt(string ipAddress, string email);
}