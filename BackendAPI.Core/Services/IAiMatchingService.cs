using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Core.Services;

public interface IAiMatchingService
{
    Task<dynamic> ProcessApplicationScoringAsync(int applicationId);
    Task<IEnumerable<dynamic>> RetrieveRecruiterAnalyticsAsync();
    Task<IEnumerable<dynamic>> RetrieveGlobalCompatibilityReportAsync();
}