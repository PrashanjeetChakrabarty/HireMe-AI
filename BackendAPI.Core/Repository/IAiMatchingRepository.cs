using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Core.Repository;

public interface IAiMatchingRepository
{
    Task<dynamic> CalculateMatchScoreAsync(int applicationId);
    Task<IEnumerable<dynamic>> GetRecruiterDashboardReportAsync();
    Task<IEnumerable<dynamic>> GetGlobalSkillMatchesAsync();
}