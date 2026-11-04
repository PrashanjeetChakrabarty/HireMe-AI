using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class DashboardService : IDashboardService
{
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly ISkillRepository _skillRepository;
    private readonly IInterviewStatusRepository _interviewStatusRepository;

    // Defines a sensible left-to-right order for pipeline stages, so charts
    // and widgets don't show statuses in random order.
    private static readonly string[] PipelineOrder =
        { "Applied", "Shortlisted", "Scheduled", "Completed", "Rejected", "Hired" };

    public DashboardService(
        IRecruiterRepository recruiterRepository,
        IJobRepository jobRepository,
        IApplicationRepository applicationRepository,
        ISkillRepository skillRepository,
        IInterviewStatusRepository interviewStatusRepository)
    {
        _recruiterRepository = recruiterRepository;
        _jobRepository = jobRepository;
        _applicationRepository = applicationRepository;
        _skillRepository = skillRepository;
        _interviewStatusRepository = interviewStatusRepository;
    }

    public async Task<DashboardOverviewResponse> GetRecruiterOverviewAsync(int userId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var jobs = await _jobRepository.GetByRecruiterIdAsync(recruiter.RecruiterId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        // Collect every application across every job this recruiter owns,
        // alongside which job it belongs to (needed for "AI Top Candidates").
        var allApplications = new List<(Models.Application Application, string JobTitle)>();

        foreach (var job in jobs)
        {
            var applications = await _applicationRepository.GetByJobIdAsync(job.JobId);
            foreach (var app in applications)
            {
                allApplications.Add((app, job.Title));
            }
        }

        // ---- Widgets ----
        var activeJobs = jobs.Count(j => j.Status == "Open");
        var totalApplicants = allApplications.Count;
        var totalCandidates = allApplications.Select(a => a.Application.CandidateId).Distinct().Count();

        var aiTopCandidates = allApplications
            .Where(a => a.Application.MatchScore != null)
            .OrderByDescending(a => a.Application.MatchScore)
            .Take(5)
            .Select(a => new TopCandidateEntry
            {
                CandidateName = a.Application.Candidate?.User?.FullName ?? string.Empty,
                JobTitle = a.JobTitle,
                MatchScore = a.Application.MatchScore ?? 0
            })
            .ToList();

        // ---- Pipeline / status breakdown (used by both a widget and a chart) ----
        var pipelineCounts = allApplications
            .GroupBy(a => a.Application.StatusId.HasValue && statusMap.ContainsKey(a.Application.StatusId.Value)
                ? statusMap[a.Application.StatusId.Value]
                : "Applied")
            .ToDictionary(g => g.Key, g => g.Count());

        var interviewPipeline = PipelineOrder
            .Where(stage => pipelineCounts.ContainsKey(stage))
            .Select(stage => new PipelineStageCount { StatusName = stage, Count = pipelineCounts[stage] })
            .ToList();

        // ---- Skill distribution across every distinct applicant ----
        var distinctCandidateIds = allApplications.Select(a => a.Application.CandidateId).Distinct();
        var skillCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var candidateId in distinctCandidateIds)
        {
            var skills = await _skillRepository.GetSkillsByCandidateIdAsync(candidateId);
            foreach (var skill in skills)
            {
                skillCounts[skill] = skillCounts.TryGetValue(skill, out var count) ? count + 1 : 1;
            }
        }

        var skillDistribution = skillCounts
            .OrderByDescending(kv => kv.Value)
            .Take(10)
            .Select(kv => new SkillCountEntry { SkillName = kv.Key, Count = kv.Value })
            .ToList();

        // ---- Hiring analytics: applications received per day ----
        var hiringAnalytics = allApplications
            .GroupBy(a => a.Application.AppliedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new HiringTrendEntry
            {
                Date = g.Key.ToString("dd MMM"),
                ApplicationCount = g.Count()
            })
            .ToList();

        return new DashboardOverviewResponse
        {
            TotalCandidates = totalCandidates,
            ActiveJobs = activeJobs,
            TotalApplicants = totalApplicants,
            AiTopCandidates = aiTopCandidates,
            InterviewPipeline = interviewPipeline,
            SkillDistribution = skillDistribution,
            CandidateStatusBreakdown = interviewPipeline,
            HiringAnalytics = hiringAnalytics
        };
    }
}