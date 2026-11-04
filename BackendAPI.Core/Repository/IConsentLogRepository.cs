using System;
using System.Threading.Tasks;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IConsentLogRepository
{
    Task AddAsync(ConsentLog entry);
    Task<bool> ExistsForVisitorAsync(string visitorId, string consentType, string version);
    Task<int> CountSinceAsync(string consentType, DateTime since);
}
