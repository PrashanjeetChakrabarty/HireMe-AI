using System.Threading.Tasks;

namespace BackendAPI.Core.Services;

public interface IConsentService
{
    // Saves that the owner of a new account accepted the Terms of Service and the Privacy Policy.
    Task RecordTermsAcceptedAsync(int userId);

    // Saves that a visitor pressed OK on the browser storage notice. Returns false when too many were saved recently.
    Task<bool> RecordStorageNoticeAsync(string visitorId);
}
