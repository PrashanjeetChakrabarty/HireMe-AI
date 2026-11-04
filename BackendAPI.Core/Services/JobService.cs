using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class JobService : IJobService
{
    private readonly IJobRepository _jobRepository;
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IUserRepository? _userRepository;
    private readonly IEmailService? _emailService;

    public JobService(
        IJobRepository jobRepository,
        IRecruiterRepository recruiterRepository,
        IUserRepository? userRepository = null,
        IEmailService? emailService = null)
    {
        _jobRepository = jobRepository;
        _recruiterRepository = recruiterRepository;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task<JobResponse> CreateJobAsync(int userId, JobCreateRequest request)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var job = new Job
        {
            RecruiterId = recruiter.RecruiterId,
            Title = request.Title,
            Description = request.Description,
            Location = request.Location,
            Status = "Open",
            PostedAt = DateTime.UtcNow,
            ExclusiveApplication = request.ExclusiveApplication,
            HireLockMonths = request.HireLockMonths,
            HireLockScope = request.HireLockScope,
            RejectWaitDays = request.RejectWaitDays,
            ResponseDeadlineDays = request.ResponseDeadlineDays,
            PoliciesAcceptedAt = DateTime.UtcNow
        };

        await _jobRepository.AddAsync(job);

        var savedJob = await _jobRepository.GetByIdAsync(job.JobId);
        await NotifyRecruiterJobPostedAsync(userId, savedJob ?? job);
        return MapToResponse(savedJob ?? job);
    }

    public async Task<List<JobResponse>> GetOpenJobsAsync()
    {
        var jobs = await _jobRepository.GetAllAsync();
        return jobs.Select(MapToResponse).ToList();
    }

    public async Task<List<JobResponse>> GetMyJobsAsync(int userId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var jobs = await _jobRepository.GetByRecruiterIdAsync(recruiter.RecruiterId);
        return jobs.Select(MapToResponse).ToList();
    }

    public async Task<JobResponse?> GetJobByIdAsync(int jobId)
    {
        var job = await _jobRepository.GetByIdAsync(jobId);
        return job == null ? null : MapToResponse(job);
    }

    public async Task<bool> UpdateJobAsync(int userId, int jobId, JobUpdateRequest request)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var job = await _jobRepository.GetByIdAsync(jobId);
        if (job == null || job.RecruiterId != recruiter.RecruiterId)
        {
            return false;
        }

        job.Title = request.Title;
        job.Description = request.Description;
        job.Location = request.Location;
        job.Status = request.Status;

        await _jobRepository.UpdateAsync(job);
        return true;
    }

    public async Task<bool> DeleteJobAsync(int userId, int jobId)
    {
        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Recruiter not found for this user.");

        var job = await _jobRepository.GetByIdAsync(jobId);
        if (job == null || job.RecruiterId != recruiter.RecruiterId)
        {
            return false;
        }

        await _jobRepository.DeleteAsync(jobId);
        return true;
    }

    // Tells the recruiter the job is live. A problem with this email must never undo the job.
    private async Task NotifyRecruiterJobPostedAsync(int userId, Job job)
    {
        if (_userRepository == null || _emailService == null)
        {
            return;
        }

        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return;
            }

            var message = NotificationEmails.JobPosted(user.FullName, job);
            await _emailService.SendEmailAsync(user.Email, message.Subject, message.Body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Job posted email failed: {ex.Message}");
        }
    }

    private static JobResponse MapToResponse(Job job) => new()
    {
        JobId = job.JobId,
        RecruiterId = job.RecruiterId,
        Title = job.Title,
        Description = job.Description,
        Location = job.Location,
        Status = job.Status,
        PostedAt = job.PostedAt,
        CompanyName = job.Recruiter?.CompanyName,
        ExclusiveApplication = job.ExclusiveApplication,
        HireLockMonths = job.HireLockMonths,
        HireLockScope = job.HireLockScope,
        RejectWaitDays = job.RejectWaitDays,
        ResponseDeadlineDays = job.ResponseDeadlineDays
    };
}