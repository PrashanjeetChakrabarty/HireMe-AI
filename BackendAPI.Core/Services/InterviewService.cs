using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class InterviewService : IInterviewService
{
    private readonly IInterviewRepository _interviewRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly IJobRepository _jobRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IInterviewStatusRepository _interviewStatusRepository;
    private readonly IEmailService _emailService;

    // These are the only status values that currently exist in the
    // InterviewStatus table (checked directly in the DB schema).
    // "Applied" and "Shortlisted" are earlier stages, not interview outcomes.
    private static readonly HashSet<string> ValidInterviewStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Scheduled", "Completed", "Rejected", "Hired"
    };

    public InterviewService(
        IInterviewRepository interviewRepository,
        IApplicationRepository applicationRepository,
        IJobRepository jobRepository,
        ICandidateRepository candidateRepository,
        IRecruiterRepository recruiterRepository,
        IInterviewStatusRepository interviewStatusRepository,
        IEmailService emailService)
    {
        _interviewRepository = interviewRepository;
        _applicationRepository = applicationRepository;
        _jobRepository = jobRepository;
        _candidateRepository = candidateRepository;
        _recruiterRepository = recruiterRepository;
        _interviewStatusRepository = interviewStatusRepository;
        _emailService = emailService;
    }

    public async Task<InterviewResponse> ScheduleInterviewAsync(int userId, ScheduleInterviewRequest request)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId)
            ?? throw new InvalidOperationException("Application not found.");

        var job = await _jobRepository.GetByIdAsync(application.JobId)
            ?? throw new InvalidOperationException("Job not found.");

        if (job.RecruiterId != recruiter.RecruiterId)
        {
            throw new UnauthorizedAccessException("You can only schedule interviews for your own jobs.");
        }

        var existing = await _interviewRepository.GetByApplicationIdAsync(request.ApplicationId);
        if (existing != null)
        {
            throw new InvalidOperationException("An interview is already scheduled for this application. Use update instead.");
        }

        var statusId = await _interviewStatusRepository.GetIdByNameAsync("Scheduled")
            ?? throw new InvalidOperationException("'Scheduled' status not found in the database.");

        var interview = new Interview
        {
            ApplicationId = request.ApplicationId,
            ScheduledAt = request.ScheduledAt,
            Mode = request.Mode,
            Venue = request.Venue,
            StatusId = statusId
        };

        await _interviewRepository.AddAsync(interview);

        // Keep the application's own status in sync with the interview stage.
        application.StatusId = statusId;
        await _applicationRepository.UpdateAsync(application);

        var candidateUser = application.Candidate?.User;
        if (candidateUser != null)
        {
            // Interview times are stored in UTC; candidates are in India, so the email shows IST.
            var istTime = TimeZoneInfo.ConvertTimeFromUtc(
                request.ScheduledAt.ToUniversalTime(),
                TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"));

            var venueLine = string.IsNullOrWhiteSpace(request.Venue)
                ? string.Empty
                : $"\nVenue: {request.Venue}";

            await _emailService.SendEmailAsync(
                candidateUser.Email,
                $"Interview Scheduled — {job.Title}",
                $"Hi {candidateUser.FullName},\n\nYour interview for \"{job.Title}\" at {job.Recruiter?.CompanyName} has been scheduled.\n\nDate & Time: {istTime:dddd, dd MMMM yyyy 'at' hh:mm tt} IST\nMode: {request.Mode}{venueLine}\n\nAll the best,\nHireMe AI Team");
        }

        return await BuildResponseAsync(interview, job.Title, job.Recruiter?.CompanyName, candidateUser?.FullName ?? string.Empty);
    }

    public async Task<InterviewResponse> UpdateInterviewAsync(int userId, int interviewId, UpdateInterviewRequest request)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var interview = await _interviewRepository.GetByIdAsync(interviewId)
            ?? throw new InvalidOperationException("Interview not found.");

        var job = interview.Application?.Job;
        if (job == null || job.RecruiterId != recruiter.RecruiterId)
        {
            throw new UnauthorizedAccessException("You can only update interviews for your own jobs.");
        }

        var becameHired = false;

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!ValidInterviewStatuses.Contains(request.Status))
            {
                throw new InvalidOperationException($"Invalid status. Must be one of: {string.Join(", ", ValidInterviewStatuses)}");
            }

            var statusId = await _interviewStatusRepository.GetIdByNameAsync(request.Status)
                ?? throw new InvalidOperationException($"Status '{request.Status}' not found in the database.");

            // True only at the moment the interview first becomes Hired, so the email goes out once.
            becameHired = request.Status.Equals("Hired", StringComparison.OrdinalIgnoreCase) && interview.StatusId != statusId;

            interview.StatusId = statusId;

            // Keep the application's status in sync too.
            if (interview.Application != null)
            {
                interview.Application.StatusId = statusId;
                await _applicationRepository.UpdateAsync(interview.Application);
            }
        }

        if (request.RecruiterComments != null)
        {
            interview.RecruiterComments = request.RecruiterComments;
        }

        if (request.Venue != null)
        {
            interview.Venue = request.Venue;
        }

        await _interviewRepository.UpdateAsync(interview);

        // Tell the candidate they were hired (sent once, only when the status just changed to Hired).
        var hiredUser = interview.Application?.Candidate?.User;
        if (becameHired && hiredUser != null)
        {
            await _emailService.SendEmailAsync(
                hiredUser.Email,
                $"Congratulations — You're hired for {job.Title}",
                $"Hi {hiredUser.FullName},\n\nWonderful news! You've been selected for \"{job.Title}\" at {job.Recruiter?.CompanyName}. The recruiter will contact you soon with the next steps.\n\nCongratulations and welcome aboard,\nHireMe AI Team");
        }

        var jobTitle = job.Title;
        var companyName = job.Recruiter?.CompanyName;
        var candidateName = interview.Application?.Candidate?.User?.FullName ?? string.Empty;

        return await BuildResponseAsync(interview, jobTitle, companyName, candidateName);
    }

    public async Task<List<InterviewResponse>> GetMyInterviewsAsync(int userId)
    {
        var candidate = await _candidateRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Candidate not found for this user.");

        var interviews = await _interviewRepository.GetByCandidateIdAsync(candidate.CandidateId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        return interviews.Select(i => MapToResponse(i, statusMap)).ToList();
    }

    public async Task<List<InterviewResponse>> GetInterviewsForRecruiterAsync(int userId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var interviews = await _interviewRepository.GetByRecruiterIdAsync(recruiter.RecruiterId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        return interviews.Select(i => MapToResponse(i, statusMap)).ToList();
    }

    private async Task<InterviewResponse> BuildResponseAsync(Interview interview, string jobTitle, string? companyName, string candidateName)
    {
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();
        var statusName = statusMap.TryGetValue(interview.StatusId, out var name) ? name : "Unknown";

        return new InterviewResponse
        {
            InterviewId = interview.InterviewId,
            ApplicationId = interview.ApplicationId,
            JobTitle = jobTitle,
            CompanyName = companyName,
            CandidateName = candidateName,
            ScheduledAt = interview.ScheduledAt,
            Mode = interview.Mode,
            Venue = interview.Venue,
            RecruiterComments = interview.RecruiterComments,
            StatusId = interview.StatusId,
            StatusName = statusName
        };
    }

    private static InterviewResponse MapToResponse(Interview interview, Dictionary<int, string> statusMap) => new()
    {
        InterviewId = interview.InterviewId,
        ApplicationId = interview.ApplicationId,
        JobTitle = interview.Application?.Job?.Title ?? string.Empty,
        CompanyName = interview.Application?.Job?.Recruiter?.CompanyName,
        CandidateName = interview.Application?.Candidate?.User?.FullName ?? string.Empty,
        ScheduledAt = interview.ScheduledAt,
        Mode = interview.Mode,
        Venue = interview.Venue,
        RecruiterComments = interview.RecruiterComments,
        StatusId = interview.StatusId,
        StatusName = statusMap.TryGetValue(interview.StatusId, out var name) ? name : "Unknown"
    };
}