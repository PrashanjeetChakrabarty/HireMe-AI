namespace BackendAPI.Core.Models
{
    public class ResumeResponse
    {
        public int ResumeId { get; set; }
        public int CandidateId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public int SkillsExtractedCount { get; set; }
        public int EducationExtractedCount { get; set; }
        public int WorkExperienceExtractedCount { get; set; }
    }
}