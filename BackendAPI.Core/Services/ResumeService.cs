using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;
using Microsoft.AspNetCore.Http;

namespace BackendAPI.Core.Services;

public class ResumeService : IResumeService
{
    private readonly IResumeRepository _resumeRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly IAiServiceClient _aiServiceClient;
    private readonly ISkillRepository _skillRepository;
    private readonly ICandidateProfileRepository _candidateProfileRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly string _uploadsFolder;

    private static readonly string[] AllowedExtensions = { ".pdf", ".docx" };

    public ResumeService(
        IResumeRepository resumeRepository,
        ICandidateRepository candidateRepository,
        IRecruiterRepository recruiterRepository,
        IApplicationRepository applicationRepository,
        IAiServiceClient aiServiceClient,
        ISkillRepository skillRepository,
        ICandidateProfileRepository candidateProfileRepository,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _resumeRepository = resumeRepository;
        _candidateRepository = candidateRepository;
        _recruiterRepository = recruiterRepository;
        _applicationRepository = applicationRepository;
        _aiServiceClient = aiServiceClient;
        _skillRepository = skillRepository;
        _candidateProfileRepository = candidateProfileRepository;
        _userRepository = userRepository;
        _emailService = emailService;

        // In Azure this points at persistent storage (set UPLOADS_PATH); locally it stays ./uploads.
        _uploadsFolder = Environment.GetEnvironmentVariable("UPLOADS_PATH")
            ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(_uploadsFolder))
        {
            Directory.CreateDirectory(_uploadsFolder);
        }
    }

    public async Task<ResumeResponse> UploadResumeAsync(int userId, IFormFile file)
    {
        var candidate = await _candidateRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Candidate not found for this user.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Only PDF and DOCX files are allowed.");
        }

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(_uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var resume = new Resume
        {
            CandidateId = candidate.CandidateId,
            FileName = file.FileName,
            FilePath = fullPath,
            UploadedAt = DateTime.UtcNow
        };

        await _resumeRepository.AddAsync(resume);

        var skillsCount = 0;
        var educationCount = 0;
        var workExperienceCount = 0;

        try
        {
            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            var analysis = await _aiServiceClient.AnalyzeResumeAsync(fileBytes, file.FileName);

            if (analysis.Skills.Count > 0)
            {
                await _skillRepository.AddSkillsToCandidateAsync(candidate.CandidateId, analysis.Skills);
                skillsCount = analysis.Skills.Count;
            }

            if (analysis.Education.Count > 0)
            {
                await _candidateProfileRepository.AddEducationAsync(candidate.CandidateId, analysis.Education);
                educationCount = analysis.Education.Count;
            }

            if (analysis.WorkExperience.Count > 0)
            {
                await _candidateProfileRepository.AddWorkExperienceAsync(candidate.CandidateId, analysis.WorkExperience);
                workExperienceCount = analysis.WorkExperience.Count;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI analysis failed for resume {resume.ResumeId}: {ex.Message}");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            await _emailService.SendEmailAsync(
                user.Email,
                "Resume Uploaded Successfully",
                $"Hi {user.FullName},\n\nYour resume \"{file.FileName}\" was uploaded and analyzed successfully.\n\nAI found: {skillsCount} skills, {educationCount} education entries, {workExperienceCount} work experience entries.\n\nThanks,\nHireMe AI Team");
        }

        var response = MapToResponse(resume);
        response.SkillsExtractedCount = skillsCount;
        response.EducationExtractedCount = educationCount;
        response.WorkExperienceExtractedCount = workExperienceCount;
        return response;
    }

    public async Task<List<ResumeResponse>> GetResumesByUserIdAsync(int userId)
    {
        var candidate = await _candidateRepository.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Candidate not found for this user.");

        var resumes = await _resumeRepository.GetByCandidateIdAsync(candidate.CandidateId);
        return resumes.Select(MapToResponse).ToList();
    }

    public async Task<(byte[] fileBytes, string fileName)?> DownloadResumeAsync(int resumeId, int requestingUserId, string requestingUserRole)
    {
        var resume = await _resumeRepository.GetByIdAsync(resumeId);
        if (resume == null || !File.Exists(resume.FilePath))
        {
            return null;
        }

        var hasAccess = false;

        if (requestingUserRole == "Candidate")
        {
            var candidate = await _candidateRepository.GetByUserIdAsync(requestingUserId);
            hasAccess = candidate != null && candidate.CandidateId == resume.CandidateId;
        }
        else if (requestingUserRole == "Recruiter")
        {
            var recruiter = await _recruiterRepository.GetByUserIdAsync(requestingUserId);
            hasAccess = recruiter != null
                && await _applicationRepository.IsResumeAccessibleToRecruiterAsync(resumeId, recruiter.RecruiterId);
        }

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to access this resume.");
        }

        var fileBytes = await File.ReadAllBytesAsync(resume.FilePath);
        return (fileBytes, resume.FileName);
    }

    public async Task<bool> DeleteResumeAsync(int resumeId, int requestingUserId)
    {
        var resume = await _resumeRepository.GetByIdAsync(resumeId);
        if (resume == null)
        {
            return false;
        }

        // Sirf jis candidate ki resume hai wahi use delete kar sakta hai
        var candidate = await _candidateRepository.GetByUserIdAsync(requestingUserId);
        if (candidate == null || candidate.CandidateId != resume.CandidateId)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this resume.");
        }

        if (File.Exists(resume.FilePath))
        {
            File.Delete(resume.FilePath);
        }

        await _resumeRepository.DeleteAsync(resumeId);
        return true;
    }

    private static ResumeResponse MapToResponse(Resume resume) => new()
    {
        ResumeId = resume.ResumeId,
        CandidateId = resume.CandidateId,
        FileName = resume.FileName,
        FilePath = resume.FilePath,
        UploadedAt = resume.UploadedAt
    };
}