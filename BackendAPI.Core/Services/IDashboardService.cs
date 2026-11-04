using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IDashboardService
{
    Task<DashboardOverviewResponse> GetRecruiterOverviewAsync(int userId);
}