namespace BackendAPI.Core.Services;

// The names of the things people can accept, and the current version of the texts.
public static class ConsentInfo
{
    public const string TermsAndPrivacy = "terms-and-privacy";
    public const string StorageNotice = "storage-notice";

    // Change this when the Terms of Service or the Privacy Policy change in a way that people should accept again.
    public const string CurrentVersion = "2026-10";
}
