using BackendAPI.Core.Repository;
using BackendAPI.Core.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace BackendAPI.Core.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ICandidateRepository _candidateRepository;
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly IOtpService _otpService;
    private readonly IEmailService? _emailService;

    public UserService(
        IUserRepository userRepository,
        ICandidateRepository candidateRepository,
        IRecruiterRepository recruiterRepository,
        IApplicationRepository applicationRepository,
        IJobRepository jobRepository,
        IResumeRepository resumeRepository,
        IOtpService otpService,
        IEmailService? emailService = null)
    {
        _userRepository = userRepository;
        _candidateRepository = candidateRepository;
        _recruiterRepository = recruiterRepository;
        _applicationRepository = applicationRepository;
        _jobRepository = jobRepository;
        _resumeRepository = resumeRepository;
        _otpService = otpService;
        _emailService = emailService;
    }

    public async Task<IEnumerable<UserResponse>> GetUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(u => MapToResponse(u));
    }

    public async Task<UserResponse?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : MapToResponse(user);
    }

    public async Task<UserResponse> CreateUserAsync(UserCreateRequest request)
    {
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = request.RoleId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        return MapToResponse(user);
    }

    public async Task<bool> UpdateUserAsync(int id, UserUpdateRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.IsActive = request.IsActive;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        await _userRepository.DeleteAsync(user);
        return true;
    }

    public async Task<ProfileResponse?> GetProfileAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return null;

        var candidate = await _candidateRepository.GetByUserIdAsync(userId);

        return new ProfileResponse
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            RoleName = user.Role?.RoleName ?? "User",
            Phone = candidate?.Phone,
            Address = candidate?.Address
        };
    }

    public async Task<bool> UpdateProfileAsync(int userId, ProfileUpdateRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.FullName = request.FullName;
        await _userRepository.UpdateAsync(user);

        var candidate = await _candidateRepository.GetByUserIdAsync(userId);
        if (candidate != null)
        {
            candidate.Phone = request.Phone;
            candidate.Address = request.Address;
            await _candidateRepository.UpdateAsync(candidate);
        }

        return true;
    }

    // Verified via an emailed OTP code (same OTP system used for login/
    // registration) instead of a password — this works for every
    // account, including Google accounts that never had a password
    // the user actually knows.
    //
    // Database mein sirf Applications table cascade-delete nahi hoti (kyunki wo Jobs,
    // Candidates, aur Resumes teeno ko reference karti hai bina ON DELETE CASCADE ke) —
    // baaki sab (Resumes, CandidateSkills, CandidateEducation, CandidateWorkExperience,
    // Jobs, JobSkills, Interviews) User delete hone par khud-ba-khud cascade ho jaate hain.
    // Isliye User row delete karne se pehle, is user ki (candidate ya recruiter, jo bhi ho)
    // saari Applications manually delete karni padti hain.
    public async Task<bool> DeleteOwnAccountAsync(int userId, string otpCode)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        var isValidOtp = await _otpService.VerifyOtpAsync(user.Email, otpCode);
        if (!isValidOtp)
        {
            throw new InvalidOperationException("Invalid or expired verification code.");
        }

        var deletedEmail = user.Email;
        var deletedName = user.FullName;

        // Remember where the resume files are, so they can be deleted from disk once the account is gone.
        var resumeFilePaths = new List<string>();

        var candidate = await _candidateRepository.GetByUserIdAsync(userId);
        if (candidate != null)
        {
            var resumes = await _resumeRepository.GetByCandidateIdAsync(candidate.CandidateId);
            resumeFilePaths.AddRange(resumes.Select(resume => resume.FilePath).Where(path => !string.IsNullOrEmpty(path)));

            var applications = await _applicationRepository.GetByCandidateIdAsync(candidate.CandidateId);
            foreach (var application in applications)
            {
                await _applicationRepository.DeleteAsync(application.ApplicationId);
            }
        }

        var recruiter = await _recruiterRepository.GetByUserIdAsync(userId);
        if (recruiter != null)
        {
            var jobs = await _jobRepository.GetByRecruiterIdAsync(recruiter.RecruiterId);
            foreach (var job in jobs)
            {
                var applications = await _applicationRepository.GetByJobIdAsync(job.JobId);
                foreach (var application in applications)
                {
                    await _applicationRepository.DeleteAsync(application.ApplicationId);
                }
            }
        }

        await _userRepository.DeleteAsync(user);

        // Confirm the deletion by email. A problem with this email must never undo the deletion.
        if (_emailService != null)
        {
            try
            {
                var goodbye = NotificationEmails.AccountDeleted(deletedName);
                await _emailService.SendEmailAsync(deletedEmail, goodbye.Subject, goodbye.Body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Account deleted email failed: {ex.Message}");
            }
        }

        // The database rows are gone, so delete the uploaded files too. A file that is missing or locked
        // must never undo the account deletion, so problems here are ignored.
        foreach (var filePath in resumeFilePaths)
        {
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch (IOException)
            {
            }
            catch (UnauthorizedAccessException)
            {
            }
        }

        return true;
    }

    private static UserResponse MapToResponse(User user) => new()
    {
        UserId = user.UserId,
        FullName = user.FullName,
        Email = user.Email,
        RoleId = user.RoleId,
        RoleName = user.Role?.RoleName ?? "User",
        CreatedAt = user.CreatedAt,
        IsActive = user.IsActive
    };
}