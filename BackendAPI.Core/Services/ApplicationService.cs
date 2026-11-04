using System.Text.Json;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class ApplicationService : IApplicationService
{
    private readonly IApplicationRepository _applicationRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly IAiServiceClient _aiServiceClient;
    private readonly ISkillRepository _skillRepository;
    private readonly ICandidateProfileRepository _candidateProfileRepository;
    private readonly IInterviewStatusRepository _interviewStatusRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Applied", "Shortlisted", "Scheduled", "Completed", "Rejected", "Hired"
    };

    public ApplicationService(
        IApplicationRepository applicationRepository,
        ICandidateRepository candidateRepository,
        IRecruiterRepository recruiterRepository,
        IJobRepository jobRepository,
        IResumeRepository resumeRepository,
        IAiServiceClient aiServiceClient,
        ISkillRepository skillRepository,
        ICandidateProfileRepository candidateProfileRepository,
        IInterviewStatusRepository interviewStatusRepository,
        IAuditLogRepository auditLogRepository,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _applicationRepository = applicationRepository;
        _candidateRepository = candidateRepository;
        _recruiterRepository = recruiterRepository;
        _jobRepository = jobRepository;
        _resumeRepository = resumeRepository;
        _aiServiceClient = aiServiceClient;
        _skillRepository = skillRepository;
        _candidateProfileRepository = candidateProfileRepository;
        _interviewStatusRepository = interviewStatusRepository;
        _auditLogRepository = auditLogRepository;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task<ApplicationResponse> ApplyAsync(int userId, ApplicationCreateRequest request)
    {
        var candidate = await _candidateRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Candidate not found for this user.");

        var job = await _jobRepository.GetByIdAsync(request.JobId)
            ?? throw new InvalidOperationException("Job not found.");

        var resume = await _resumeRepository.GetByIdAsync(request.ResumeId)
            ?? throw new InvalidOperationException("Resume not found.");

        if (resume.CandidateId != candidate.CandidateId)
        {
            throw new InvalidOperationException("You can only apply using your own resume.");
        }

        var alreadyApplied = await _applicationRepository.ExistsAsync(request.JobId, candidate.CandidateId);
        if (alreadyApplied)
        {
            throw new InvalidOperationException("You have already applied to this job.");
        }

        var candidateApplications = await _applicationRepository.GetByCandidateIdAsync(candidate.CandidateId);
        var statusNames = await _interviewStatusRepository.GetAllAsDictionaryAsync();
        var ruleCheck = ApplyPolicyChecker.Check(job, candidateApplications, statusNames, DateTime.UtcNow);
        if (!ruleCheck.Allowed)
        {
            throw new InvalidOperationException(ruleCheck.Message);
        }

        var appliedStatusId = await _interviewStatusRepository.GetIdByNameAsync("Applied");

        var application = new Application
        {
            JobId = request.JobId,
            CandidateId = candidate.CandidateId,
            ResumeId = request.ResumeId,
            AppliedAt = DateTime.UtcNow,
            StatusId = appliedStatusId,
            AcceptedPoliciesAt = DateTime.UtcNow
        };

        try
        {
            var resumeBytes = await File.ReadAllBytesAsync(resume.FilePath);
            var scoreResult = await _aiServiceClient.ScoreApplicationAsync(
                resumeBytes, resume.FileName, job.Description);

            application.MatchScore = (decimal)scoreResult.FinalScore;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI scoring failed for application (job {job.JobId}, candidate {candidate.CandidateId}): {ex.Message}");
        }

        await _applicationRepository.AddAsync(application);

        var applicantUser = await _userRepository.GetByIdAsync(userId);
        if (applicantUser != null)
        {
            await _emailService.SendEmailAsync(
                applicantUser.Email,
                $"Application Submitted — {job.Title}",
                $"Hi {applicantUser.FullName},\n\nYour application for \"{job.Title}\" at {job.Recruiter?.CompanyName} has been submitted successfully.{ApplicationEmailNotes.AppliedNote(job)}\n\nThanks,\nHireMe AI Team");
        }

        await NotifyRecruiterOfNewApplicantAsync(job, applicantUser?.FullName ?? "A candidate", application.MatchScore);

        return new ApplicationResponse
        {
            ApplicationId = application.ApplicationId,
            JobId = job.JobId,
            JobTitle = job.Title,
            CompanyName = job.Recruiter?.CompanyName,
            CandidateId = candidate.CandidateId,
            ResumeId = resume.ResumeId,
            ResumeFileName = resume.FileName,
            AppliedAt = application.AppliedAt,
            MatchScore = application.MatchScore,
            StatusId = application.StatusId,
            StatusName = "Applied",
            ShortlistedAt = application.ShortlistedAt
        };
    }

    public async Task<List<ApplicationResponse>> GetMyApplicationsAsync(int userId)
    {
        var candidate = await _candidateRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Candidate not found for this user.");

        var applications = await _applicationRepository.GetByCandidateIdAsync(candidate.CandidateId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        return applications.Select(a => new ApplicationResponse
        {
            ApplicationId = a.ApplicationId,
            JobId = a.JobId,
            JobTitle = a.Job?.Title ?? string.Empty,
            CompanyName = a.Job?.Recruiter?.CompanyName,
            CandidateId = a.CandidateId,
            ResumeId = a.ResumeId,
            ResumeFileName = a.Resume?.FileName ?? string.Empty,
            AppliedAt = a.AppliedAt,
            MatchScore = a.MatchScore,
            StatusId = a.StatusId,
            StatusName = a.StatusId.HasValue && statusMap.ContainsKey(a.StatusId.Value)
                ? statusMap[a.StatusId.Value]
                : "Applied",
            ShortlistedAt = a.ShortlistedAt
        }).ToList();
    }

    public async Task<List<ApplicationResponse>> GetApplicantsForJobAsync(int userId, int jobId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var job = await _jobRepository.GetByIdAsync(jobId)
            ?? throw new InvalidOperationException("Job not found.");

        if (job.RecruiterId != recruiter.RecruiterId)
        {
            throw new UnauthorizedAccessException("You can only view applicants for your own jobs.");
        }

        var applications = await _applicationRepository.GetByJobIdAsync(jobId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        return applications.Select(a => new ApplicationResponse
        {
            ApplicationId = a.ApplicationId,
            JobId = a.JobId,
            JobTitle = job.Title,
            CompanyName = job.Recruiter?.CompanyName,
            CandidateId = a.CandidateId,
            CandidateName = a.Candidate?.User?.FullName ?? string.Empty,
            ResumeId = a.ResumeId,
            ResumeFileName = a.Resume?.FileName ?? string.Empty,
            AppliedAt = a.AppliedAt,
            MatchScore = a.MatchScore,
            StatusId = a.StatusId,
            StatusName = a.StatusId.HasValue && statusMap.ContainsKey(a.StatusId.Value)
                ? statusMap[a.StatusId.Value]
                : "Applied",
            ShortlistedAt = a.ShortlistedAt
        }).ToList();
    }

    public async Task<CandidateProfileResponse> GetCandidateProfileAsync(int userId, int applicationId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var application = await _applicationRepository.GetByIdAsync(applicationId)
            ?? throw new InvalidOperationException("Application not found.");

        var job = await _jobRepository.GetByIdAsync(application.JobId)
            ?? throw new InvalidOperationException("Job not found.");

        if (job.RecruiterId != recruiter.RecruiterId)
        {
            throw new UnauthorizedAccessException("You can only view profiles of applicants to your own jobs.");
        }

        var skills = await _skillRepository.GetSkillsByCandidateIdAsync(application.CandidateId);
        var education = await _candidateProfileRepository.GetEducationByCandidateIdAsync(application.CandidateId);
        var workExperience = await _candidateProfileRepository.GetWorkExperienceByCandidateIdAsync(application.CandidateId);

        return new CandidateProfileResponse
        {
            CandidateId = application.CandidateId,
            CandidateName = application.Candidate?.User?.FullName ?? string.Empty,
            Skills = skills,
            Education = education,
            WorkExperience = workExperience
        };
    }

    public async Task<ApplicationResponse> UpdateApplicationStatusAsync(int userId, int applicationId, string status)
    {
        if (!ValidStatuses.Contains(status))
        {
            throw new InvalidOperationException($"Invalid status. Must be one of: {string.Join(", ", ValidStatuses)}");
        }

        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var application = await _applicationRepository.GetByIdAsync(applicationId)
            ?? throw new InvalidOperationException("Application not found.");

        var job = await _jobRepository.GetByIdAsync(application.JobId)
            ?? throw new InvalidOperationException("Job not found.");

        if (job.RecruiterId != recruiter.RecruiterId)
        {
            throw new UnauthorizedAccessException("You can only update applications for your own jobs.");
        }

        var statusId = await _interviewStatusRepository.GetIdByNameAsync(status)
            ?? throw new InvalidOperationException($"Status '{status}' not found in the database.");

        var previousStatusId = application.StatusId;
        application.StatusId = statusId;

        // Remember when the final decision was made. The hire lock and the wait after a rejection count from this moment.
        var isFinalDecision = status.Equals("Hired", StringComparison.OrdinalIgnoreCase)
            || status.Equals("Rejected", StringComparison.OrdinalIgnoreCase);
        if (isFinalDecision && previousStatusId != statusId)
        {
            application.DecidedAt = DateTime.UtcNow;
        }
        else if (!isFinalDecision)
        {
            application.DecidedAt = null;
        }

        if (status.Equals("Shortlisted", StringComparison.OrdinalIgnoreCase) && application.ShortlistedAt == null)
        {
            application.ShortlistedAt = DateTime.UtcNow;
        }

        await _applicationRepository.UpdateAsync(application);

        // Email the candidate only when the status really changed,
        // so setting the same status again never sends a duplicate.
        if (previousStatusId != statusId)
        {
            var candidateUser = application.Candidate?.User;

            if (candidateUser != null && status.Equals("Shortlisted", StringComparison.OrdinalIgnoreCase))
            {
                await _emailService.SendEmailAsync(
                    candidateUser.Email,
                    $"Congratulations — Shortlisted for {job.Title}",
                    $"Hi {candidateUser.FullName},\n\nGreat news! You've been shortlisted for \"{job.Title}\" at {job.Recruiter?.CompanyName}.\n\nThanks,\nHireMe AI Team");
            }
            else if (candidateUser != null && status.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
            {
                await _emailService.SendEmailAsync(
                    candidateUser.Email,
                    $"Update on your application for {job.Title}",
                    $"Hi {candidateUser.FullName},\n\nThank you for applying for \"{job.Title}\" at {job.Recruiter?.CompanyName}. After careful review, we've decided to move forward with other candidates at this time.\n\n{ApplicationEmailNotes.RejectedNote(job, application.DecidedAt)}\n\nThanks,\nHireMe AI Team");
            }
            else if (candidateUser != null && status.Equals("Hired", StringComparison.OrdinalIgnoreCase))
            {
                await _emailService.SendEmailAsync(
                    candidateUser.Email,
                    $"Congratulations — You're hired for {job.Title}",
                    $"Hi {candidateUser.FullName},\n\nWonderful news! You've been selected for \"{job.Title}\" at {job.Recruiter?.CompanyName}. The recruiter will contact you soon with the next steps.{ApplicationEmailNotes.HiredNote(job, application.DecidedAt)}\n\nCongratulations and welcome aboard,\nHireMe AI Team");
            }
        }

        return new ApplicationResponse
        {
            ApplicationId = application.ApplicationId,
            JobId = job.JobId,
            JobTitle = job.Title,
            CompanyName = job.Recruiter?.CompanyName,
            CandidateId = application.CandidateId,
            CandidateName = application.Candidate?.User?.FullName ?? string.Empty,
            ResumeId = application.ResumeId,
            AppliedAt = application.AppliedAt,
            MatchScore = application.MatchScore,
            StatusId = statusId,
            StatusName = status,
            ShortlistedAt = application.ShortlistedAt
        };
    }

    // The audit log is linked to an application only by its number. If an old application with the same number
    // was deleted and the counter was reset, its old entries would show up under the new application.
    // An application cannot have history from before it existed, so those entries are skipped.
    private async Task<List<AuditLog>> GetOwnAuditLogsAsync(Application application)
    {
        var logs = await _auditLogRepository.GetByRecordIdAsync("Applications", application.ApplicationId);
        var earliest = application.AppliedAt.AddMinutes(-5);
        return logs.Where(log => log.ChangedAt >= earliest).ToList();
    }

    public async Task<List<AuditLogEntryResponse>> GetActivityLogAsync(int userId, int applicationId)
    {
        var application = await _applicationRepository.GetByIdAsync(applicationId)
            ?? throw new InvalidOperationException("Application not found.");

        var job = await _jobRepository.GetByIdAsync(application.JobId)
            ?? throw new InvalidOperationException("Job not found.");

        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId);
        var candidate = await _candidateRepository.GetByUserIdAsync(userId);

        var isOwningRecruiter = recruiter != null && job.RecruiterId == recruiter.RecruiterId;
        var isOwningCandidate = candidate != null && application.CandidateId == candidate.CandidateId;

        if (!isOwningRecruiter && !isOwningCandidate)
        {
            throw new UnauthorizedAccessException("You do not have permission to view this activity log.");
        }

        var logs = await GetOwnAuditLogsAsync(application);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        return logs.Select(log => new AuditLogEntryResponse
        {
            Action = log.Action,
            ChangedAt = log.ChangedAt,
            Summary = BuildSummary(log, statusMap)
        }).ToList();
    }

    public async Task<List<ActivityFeedEntryResponse>> GetRecruiterActivityFeedAsync(int userId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var jobs = await _jobRepository.GetByRecruiterIdAsync(recruiter.RecruiterId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        var feed = new List<ActivityFeedEntryResponse>();

        foreach (var job in jobs)
        {
            var applications = await _applicationRepository.GetByJobIdAsync(job.JobId);

            foreach (var application in applications)
            {
                var logs = await GetOwnAuditLogsAsync(application);

                foreach (var log in logs)
                {
                    feed.Add(new ActivityFeedEntryResponse
                    {
                        CandidateName = application.Candidate?.User?.FullName ?? string.Empty,
                        JobTitle = job.Title,
                        Action = log.Action,
                        ChangedAt = log.ChangedAt,
                        Summary = BuildSummary(log, statusMap)
                    });
                }
            }
        }

        return feed.OrderByDescending(entry => entry.ChangedAt).ToList();
    }

    public async Task<List<ActivityFeedEntryResponse>> GetCandidateActivityFeedAsync(int userId)
    {
        var candidate = await _candidateRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Candidate not found for this user.");

        var applications = await _applicationRepository.GetByCandidateIdAsync(candidate.CandidateId);
        var statusMap = await _interviewStatusRepository.GetAllAsDictionaryAsync();

        var feed = new List<ActivityFeedEntryResponse>();

        foreach (var application in applications)
        {
            var logs = await GetOwnAuditLogsAsync(application);

            foreach (var log in logs)
            {
                feed.Add(new ActivityFeedEntryResponse
                {
                    CandidateName = string.Empty,
                    JobTitle = application.Job?.Title ?? string.Empty,
                    Action = log.Action,
                    ChangedAt = log.ChangedAt,
                    Summary = BuildSummary(log, statusMap)
                });
            }
        }

        return feed.OrderByDescending(entry => entry.ChangedAt).ToList();
    }

    // Tells the recruiter that someone applied. A problem with this email must never undo the application.
    private async Task NotifyRecruiterOfNewApplicantAsync(Job job, string candidateName, decimal? matchScore)
    {
        try
        {
            if (job.Recruiter == null)
            {
                return;
            }

            var recruiterUser = await _userRepository.GetByIdAsync(job.Recruiter.UserId);
            if (recruiterUser == null)
            {
                return;
            }

            var message = NotificationEmails.NewApplicant(recruiterUser.FullName, candidateName, job.Title, matchScore);
            await _emailService.SendEmailAsync(recruiterUser.Email, message.Subject, message.Body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"New applicant email failed: {ex.Message}");
        }
    }

    private string BuildSummary(AuditLog log, Dictionary<int, string> statusMap)
    {
        if (log.Action == "INSERT")
        {
            return "Application submitted";
        }

        if (log.Action == "UPDATE" && !string.IsNullOrEmpty(log.NewValues))
        {
            try
            {
                using var doc = JsonDocument.Parse(log.NewValues);
                if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                {
                    var first = doc.RootElement[0];
                    if (first.TryGetProperty("StatusId", out var statusIdProp)
                        && statusIdProp.TryGetInt32(out var statusId)
                        && statusMap.TryGetValue(statusId, out var statusName))
                    {
                        return $"Status changed to {statusName}";
                    }
                }
            }
            catch (JsonException)
            {
                // Fall through to generic message below
            }

            return "Application updated";
        }

        return log.Action;
    }
}