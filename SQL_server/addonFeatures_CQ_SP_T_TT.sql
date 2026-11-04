/* addonFeatures_CQ_SP_T_TT.sql — Add-on----- Stored Procedure + Complex Query + Trigger + Temp Table */

USE ResumeScreeningDB;
GO

/* STORED PROCEDURE */

IF OBJECT_ID('dbo.usp_CalculateMatchScore', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_CalculateMatchScore;
GO

CREATE PROCEDURE dbo.usp_CalculateMatchScore
    @ApplicationId INT
AS
BEGIN
    SET NOCOUNT ON;   

    DECLARE @JobId INT, @CandidateId INT;

    
    SELECT @JobId = JobId, @CandidateId = CandidateId
    FROM Applications
    WHERE ApplicationId = @ApplicationId;

    IF @JobId IS NULL
    BEGIN
        RAISERROR('Application not found.', 16, 1);
        RETURN;
    END

    
    DECLARE @RequiredSkillCount INT =
        (SELECT COUNT(*) FROM JobSkills WHERE JobId = @JobId);

    
    DECLARE @MatchedSkillCount INT = (
        SELECT COUNT(*)
        FROM JobSkills js
        JOIN CandidateSkills cs
            ON cs.SkillId = js.SkillId AND cs.CandidateId = @CandidateId
        WHERE js.JobId = @JobId
    );


    DECLARE @Score DECIMAL(5,2) =
        CASE WHEN @RequiredSkillCount = 0 THEN 0
             ELSE CAST(@MatchedSkillCount AS DECIMAL(5,2)) / @RequiredSkillCount * 100
        END;


    UPDATE Applications SET MatchScore = @Score WHERE ApplicationId = @ApplicationId;


    SELECT @Score AS MatchScore, @MatchedSkillCount AS MatchedSkills, @RequiredSkillCount AS RequiredSkills;
END;
GO


/* TRIGGER */

IF OBJECT_ID('dbo.AuditLog', 'U') IS NULL
BEGIN
    CREATE TABLE AuditLog (
        AuditId     INT IDENTITY(1,1) PRIMARY KEY,
        TableName   NVARCHAR(100) NOT NULL,
        RecordId    INT NOT NULL,
        Action      NVARCHAR(10) NOT NULL,    -- INSERT / UPDATE / DELETE
        ChangedBy   INT NULL,
        ChangedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        OldValues   NVARCHAR(MAX) NULL,
        NewValues   NVARCHAR(MAX) NULL
    );
END
GO

IF OBJECT_ID('dbo.trg_Applications_Audit', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Applications_Audit;
GO

CREATE TRIGGER dbo.trg_Applications_Audit
ON dbo.Applications
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserId INT = TRY_CAST(SESSION_CONTEXT(N'UserId') AS INT);

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)

        INSERT INTO AuditLog (TableName, RecordId, Action, ChangedBy, OldValues, NewValues)
        SELECT 'Applications', i.ApplicationId, 'UPDATE', @UserId,
               (SELECT d.* FROM deleted d WHERE d.ApplicationId = i.ApplicationId FOR JSON AUTO),
               (SELECT i2.* FROM inserted i2 WHERE i2.ApplicationId = i.ApplicationId FOR JSON AUTO)
        FROM inserted i;

    ELSE IF EXISTS (SELECT 1 FROM inserted)

        INSERT INTO AuditLog (TableName, RecordId, Action, ChangedBy, NewValues)
        SELECT 'Applications', i.ApplicationId, 'INSERT', @UserId,
               (SELECT i2.* FROM inserted i2 WHERE i2.ApplicationId = i.ApplicationId FOR JSON AUTO)
        FROM inserted i;

    ELSE IF EXISTS (SELECT 1 FROM deleted)

        INSERT INTO AuditLog (TableName, RecordId, Action, ChangedBy, OldValues)
        SELECT 'Applications', d.ApplicationId, 'DELETE', @UserId,
               (SELECT d2.* FROM deleted d2 WHERE d2.ApplicationId = d.ApplicationId FOR JSON AUTO)
        FROM deleted d;
END;
GO


/* COMPLEX QUERY */

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
ORDER BY TotalApplicants DESC;
GO


/* TEMP TABLE */

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

DROP TABLE #SkillMatches;
GO

ALTER TABLE Interviews ADD Venue NVARCHAR(255) NULL;
GO