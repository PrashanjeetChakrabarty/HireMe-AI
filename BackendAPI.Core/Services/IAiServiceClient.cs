using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public interface IAiServiceClient
{
    Task<ResumeAnalysisResult> AnalyzeResumeAsync(byte[] fileBytes, string fileName);
    Task<CandidateScoreResult> ScoreApplicationAsync(byte[] resumeBytes, string resumeFileName, string jobDescriptionText);
}