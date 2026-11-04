using System;

namespace BackendAPI.Core.Models;

// One row every time somebody accepts something: the Terms of Service and the Privacy Policy when an account
// is created, or the browser storage notice when somebody visits the site. Rows are only ever added.
public class ConsentLog
{
    public int ConsentLogId { get; set; }

    // The account that accepted the terms. Empty for the storage notice, because nobody is logged in yet.
    public int? UserId { get; set; }

    // A random id that the browser made for itself. It is used for the storage notice only.
    public string? VisitorId { get; set; }

    // "terms-and-privacy" or "storage-notice"
    public string ConsentType { get; set; } = string.Empty;

    // The version of the text that was shown, for example "2026-10".
    public string Version { get; set; } = string.Empty;

    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
}
