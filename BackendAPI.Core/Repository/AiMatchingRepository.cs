using System.Data;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;

namespace BackendAPI.Core.Repository;

public class AiMatchingRepository : IAiMatchingRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public AiMatchingRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // 1. EXECUTES STORED PROCEDURE: usp_CalculateMatchScore
    public async Task<dynamic> CalculateMatchScoreAsync(int applicationId)
    {
        using IDbConnection db = _connectionFactory.CreateConnection();
        string procedureName = "usp_CalculateMatchScore";
        
        var result = await db.QuerySingleOrDefaultAsync<dynamic>(
            procedureName,
            new { ApplicationId = applicationId },
            commandType: CommandType.StoredProcedure
        );

        // Resolves CS8603 warning by verifying data existence before return
        if (result == null)
        {
            throw new KeyNotFoundException($"Application with ID {applicationId} was not found.");
        }

        return result;
    }

    // 2. EXECUTES COMPLEX JOINS: Recruiter Dashboard Report
    public async Task<IEnumerable<dynamic>> GetRecruiterDashboardReportAsync()
    {
        using IDbConnection db = _connectionFactory.CreateConnection();
        string sql = @"
            SELECT
                j.JobId,
                j.Title                                    AS JobTitle,
                rec.CompanyName,
                COUNT(a.ApplicationId)                     AS TotalApplicants,
                AVG(a.MatchScore)                          AS AvgMatchScore,
                MAX(a.MatchScore)                          AS TopMatchScore,
                (
                    SELECT TOP 1 u.FullName
                    FROM Applications a2
                    JOIN Candidates c2 ON c2.CandidateId = a2.CandidateId
                    JOIN Users u ON u.UserId = c2.UserId
                    WHERE a2.JobId = j.JobId
                    ORDER BY a2.MatchScore DESC
                )                                           AS TopCandidateName
            FROM Jobs j
            JOIN Recruiters rec ON rec.RecruiterId = j.RecruiterId
            LEFT JOIN Applications a ON a.JobId = j.JobId
            WHERE j.Status = 'Open'
            GROUP BY j.JobId, j.Title, rec.CompanyName
            ORDER BY TotalApplicants DESC;";

        return await db.QueryAsync<dynamic>(sql);
    }

    // 3. EXECUTES TEMP TABLE METRICS: Candidate/Job Skill Match Percentages
    public async Task<IEnumerable<dynamic>> GetGlobalSkillMatchesAsync()
    {
        using IDbConnection db = _connectionFactory.CreateConnection();
        
        string sql = @"
            IF OBJECT_ID('tempdb..#SkillMatches') IS NOT NULL DROP TABLE #SkillMatches;

            SELECT
                c.CandidateId,
                j.JobId,
                COUNT(DISTINCT cs.SkillId)                              AS MatchedSkills,
                (SELECT COUNT(*) FROM JobSkills WHERE JobId = j.JobId)   AS RequiredSkills
            INTO #SkillMatches
            FROM Candidates c
            CROSS JOIN Jobs j
            LEFT JOIN JobSkills js ON js.JobId = j.JobId
            LEFT JOIN CandidateSkills cs ON cs.SkillId = js.SkillId AND cs.CandidateId = c.CandidateId
            WHERE j.Status = 'Open'
            GROUP BY c.CandidateId, j.JobId;

            SELECT
                u.FullName          AS Candidate,
                j.Title              AS Job,
                sm.MatchedSkills,
                sm.RequiredSkills,
                CASE WHEN sm.RequiredSkills = 0 THEN 0
                     ELSE CAST(sm.MatchedSkills AS DECIMAL(5,2)) / sm.RequiredSkills * 100
                END AS MatchPercentage
            FROM #SkillMatches sm
            JOIN Candidates c ON c.CandidateId = sm.CandidateId
            JOIN Users u ON u.UserId = c.UserId
            JOIN Jobs j ON j.JobId = sm.JobId
            ORDER BY MatchPercentage DESC;

            DROP TABLE #SkillMatches;";

        return await db.QueryAsync<dynamic>(sql);
    }
}