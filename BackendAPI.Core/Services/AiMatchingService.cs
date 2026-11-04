using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BackendAPI.Core.Repository;

namespace BackendAPI.Core.Services;

public class AiMatchingService : IAiMatchingService
{
    private readonly IAiMatchingRepository _matchingRepository;

    public AiMatchingService(IAiMatchingRepository matchingRepository)
    {
        _matchingRepository = matchingRepository;
    }

    public async Task<dynamic> ProcessApplicationScoringAsync(int applicationId)
    {
        if (applicationId <= 0)
        {
            throw new ArgumentException("Application tracking identifiers must be positive non-zero values.", nameof(applicationId));
        }

        return await _matchingRepository.CalculateMatchScoreAsync(applicationId);
    }

    public async Task<IEnumerable<dynamic>> RetrieveRecruiterAnalyticsAsync()
    {
        return await _matchingRepository.GetRecruiterDashboardReportAsync();
    }

    public async Task<IEnumerable<dynamic>> RetrieveGlobalCompatibilityReportAsync()
    {
        return await _matchingRepository.GetGlobalSkillMatchesAsync();
    }
}