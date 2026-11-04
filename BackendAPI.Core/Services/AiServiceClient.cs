using System.Net.Http.Headers;
using System.Text.Json;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class AiServiceClient : IAiServiceClient
{
    private readonly HttpClient _httpClient;

    public AiServiceClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ResumeAnalysisResult> AnalyzeResumeAsync(byte[] fileBytes, string fileName)
    {
        using var content = new MultipartFormDataContent();
        using var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetContentType(fileName));
        content.Add(fileContent, "file", fileName);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsync("/resume-summary", content);
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException(
                "Could not reach the AI service. Make sure the Python AiService is running (uvicorn on port 8000).", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"AI service returned an error ({(int)response.StatusCode}): {errorBody}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();

        var result = JsonSerializer.Deserialize<ResumeAnalysisResult>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? new ResumeAnalysisResult();
    }

    public async Task<CandidateScoreResult> ScoreApplicationAsync(byte[] resumeBytes, string resumeFileName, string jobDescriptionText)
    {
        using var content = new MultipartFormDataContent();

        using var fileContent = new ByteArrayContent(resumeBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetContentType(resumeFileName));
        content.Add(fileContent, "resume", resumeFileName);

        content.Add(new StringContent(jobDescriptionText), "job_description_text");

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsync("/score-application", content);
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException(
                "Could not reach the AI service. Make sure the Python AiService is running (uvicorn on port 8000).", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"AI service returned an error ({(int)response.StatusCode}): {errorBody}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();

        var result = JsonSerializer.Deserialize<CandidateScoreResult>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? new CandidateScoreResult();
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };
    }
}