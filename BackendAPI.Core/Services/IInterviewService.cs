using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IInterviewService
{
    Task<InterviewResponse> ScheduleInterviewAsync(int userId, ScheduleInterviewRequest request);
    Task<InterviewResponse> UpdateInterviewAsync(int userId, int interviewId, UpdateInterviewRequest request);
    Task<List<InterviewResponse>> GetMyInterviewsAsync(int userId);
    Task<List<InterviewResponse>> GetInterviewsForRecruiterAsync(int userId);
}