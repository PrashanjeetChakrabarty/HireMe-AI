using System.Threading.Tasks;

namespace BackendAPI.Core.Services;

public interface ITurnstileService
{
    // True when the visitor passed the "I am human" check. Always true while no secret key is configured.
    Task<bool> VerifyAsync(string? token, string? remoteIp);
}
