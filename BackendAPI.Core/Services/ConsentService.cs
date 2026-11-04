using System;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;

namespace BackendAPI.Core.Services;

public class ConsentService : IConsentService
{
    // A safety cap, so nobody can fill the table with made-up visitor ids.
    private const int MaxNoticeRowsPerHour = 2000;

    private readonly IConsentLogRepository _repository;

    public ConsentService(IConsentLogRepository repository)
    {
        _repository = repository;
    }

    public async Task RecordTermsAcceptedAsync(int userId)
    {
        await _repository.AddAsync(new ConsentLog
        {
            UserId = userId,
            ConsentType = ConsentInfo.TermsAndPrivacy,
            Version = ConsentInfo.CurrentVersion,
            AcceptedAt = DateTime.UtcNow
        });
    }

    public async Task<bool> RecordStorageNoticeAsync(string visitorId)
    {
        // The same visitor pressing OK again does not add a second row.
        if (await _repository.ExistsForVisitorAsync(visitorId, ConsentInfo.StorageNotice, ConsentInfo.CurrentVersion))
        {
            return true;
        }

        var recent = await _repository.CountSinceAsync(ConsentInfo.StorageNotice, DateTime.UtcNow.AddHours(-1));
        if (recent >= MaxNoticeRowsPerHour)
        {
            return false;
        }

        await _repository.AddAsync(new ConsentLog
        {
            VisitorId = visitorId,
            ConsentType = ConsentInfo.StorageNotice,
            Version = ConsentInfo.CurrentVersion,
            AcceptedAt = DateTime.UtcNow
        });
        return true;
    }
}
