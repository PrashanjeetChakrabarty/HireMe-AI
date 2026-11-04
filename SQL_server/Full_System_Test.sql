/* sample_test_data.sql — this file is to test EVERY component of the database 
   tables, PK constraints, FK constraints, UNIQUE constraints,
   cascade deletes, the stored procedure, and the trigger.
*/

USE ResumeScreeningDB;
GO

PRINT '=========================================================';
PRINT 'TEST 1: Row counts — every table should have data';
PRINT '=========================================================';
GO

SELECT 'Roles' AS TableName, COUNT(*) AS [RowCount] FROM Roles
UNION ALL SELECT 'Users', COUNT(*) FROM Users
UNION ALL SELECT 'Candidates', COUNT(*) FROM Candidates
UNION ALL SELECT 'Recruiters', COUNT(*) FROM Recruiters
UNION ALL SELECT 'Resumes', COUNT(*) FROM Resumes
UNION ALL SELECT 'Skills', COUNT(*) FROM Skills
UNION ALL SELECT 'CandidateSkills', COUNT(*) FROM CandidateSkills
UNION ALL SELECT 'Jobs', COUNT(*) FROM Jobs
UNION ALL SELECT 'JobSkills', COUNT(*) FROM JobSkills
UNION ALL SELECT 'Applications', COUNT(*) FROM Applications
UNION ALL SELECT 'InterviewStatus', COUNT(*) FROM InterviewStatus
UNION ALL SELECT 'Interviews', COUNT(*) FROM Interviews;
GO


PRINT '=========================================================';
PRINT 'TEST 2: PRIMARY KEY enforcement';
PRINT 'Trying to insert a duplicate RoleId manually — this MUST fail.';
PRINT '=========================================================';
GO

BEGIN TRY
    SET IDENTITY_INSERT Roles ON;
    INSERT INTO Roles (RoleId, RoleName) VALUES (1, 'DuplicateTest');
    SET IDENTITY_INSERT Roles OFF;
    PRINT 'FAIL: duplicate primary key was allowed! Something is wrong.';
END TRY
BEGIN CATCH
    SET IDENTITY_INSERT Roles OFF;
    PRINT 'PASS: duplicate primary key was correctly rejected.';
    PRINT 'Error was: ' + ERROR_MESSAGE();
END CATCH
GO


PRINT '=========================================================';
PRINT 'TEST 3: FOREIGN KEY enforcement';
PRINT 'Trying to insert a Candidate pointing to a UserId that does not exist — MUST fail.';
PRINT '=========================================================';
GO

BEGIN TRY
    INSERT INTO Candidates (UserId, Phone) VALUES (999999, '0000000000');
    PRINT 'FAIL: invalid foreign key was allowed! Something is wrong.';
END TRY
BEGIN CATCH
    PRINT 'PASS: invalid foreign key was correctly rejected.';
    PRINT 'Error was: ' + ERROR_MESSAGE();
END CATCH
GO


PRINT '=========================================================';
PRINT 'TEST 4: UNIQUE constraint enforcement';
PRINT 'Trying to insert a duplicate (JobId, CandidateId) application — MUST fail.';
PRINT '=========================================================';
GO

BEGIN TRY
    DECLARE @JobId INT;
    DECLARE @CandidateId INT;
    DECLARE @ResumeId INT;

    SELECT TOP 1 @JobId = JobId FROM Applications;
    SELECT TOP 1 @CandidateId = CandidateId FROM Applications WHERE JobId = @JobId;
    SELECT TOP 1 @ResumeId = ResumeId FROM Resumes WHERE CandidateId = @CandidateId;

    INSERT INTO Applications (JobId, CandidateId, ResumeId) VALUES (@JobId, @CandidateId, @ResumeId);
    PRINT 'FAIL: duplicate application for the same job+candidate was allowed!';
END TRY
BEGIN CATCH
    PRINT 'PASS: duplicate application was correctly rejected.';
    PRINT 'Error was: ' + ERROR_MESSAGE();
END CATCH
GO


PRINT '=========================================================';
PRINT 'TEST 5: Stored procedure — usp_CalculateMatchScore';
PRINT '=========================================================';
GO

DECLARE @TestAppId INT;

SELECT TOP 1 @TestAppId = ApplicationId FROM Applications ORDER BY ApplicationId;

PRINT 'Running usp_CalculateMatchScore for ApplicationId = ' + CAST(@TestAppId AS NVARCHAR);
EXEC usp_CalculateMatchScore @ApplicationId = @TestAppId;
PRINT 'PASS if you see a MatchScore/MatchedSkills/RequiredSkills row above in Query Results.';
GO

PRINT 'Now testing with an ApplicationId that does NOT exist — should raise an error.';
GO

BEGIN TRY
    EXEC usp_CalculateMatchScore @ApplicationId = 999999;
    PRINT 'FAIL: procedure did not error on invalid ApplicationId.';
END TRY
BEGIN CATCH
    PRINT 'PASS: procedure correctly raised an error for invalid ApplicationId.';
    PRINT 'Error was: ' + ERROR_MESSAGE();
END CATCH
GO


PRINT '=========================================================';
PRINT 'TEST 6: Trigger — trg_Applications_Audit (INSERT / UPDATE / DELETE)';
PRINT '=========================================================';
GO

DECLARE @AuditCountBefore INT;
DECLARE @TestJobId INT;
DECLARE @TestCandidateId INT;
DECLARE @TestResumeId INT;
DECLARE @NewAppId INT;
DECLARE @AuditCountAfter INT;

SELECT @AuditCountBefore = COUNT(*) FROM AuditLog;

SELECT TOP 1 @TestJobId = JobId FROM Jobs ORDER BY NEWID();

SELECT TOP 1 @TestCandidateId = c.CandidateId
FROM Candidates c
WHERE c.CandidateId NOT IN (SELECT CandidateId FROM Applications WHERE JobId = @TestJobId);

SELECT TOP 1 @TestResumeId = ResumeId FROM Resumes WHERE CandidateId = @TestCandidateId;

INSERT INTO Applications (JobId, CandidateId, ResumeId, MatchScore)
VALUES (@TestJobId, @TestCandidateId, @TestResumeId, 50.00);

SET @NewAppId = CAST(SCOPE_IDENTITY() AS INT);


UPDATE Applications SET MatchScore = 77.00 WHERE ApplicationId = @NewAppId;


DELETE FROM Applications WHERE ApplicationId = @NewAppId;

SELECT @AuditCountAfter = COUNT(*) FROM AuditLog;

IF @AuditCountAfter = @AuditCountBefore + 3
    PRINT 'PASS: trigger logged exactly 3 new audit rows (1 INSERT + 1 UPDATE + 1 DELETE).';
ELSE
    PRINT 'FAIL: expected 3 new audit rows, got ' + CAST(@AuditCountAfter - @AuditCountBefore AS NVARCHAR) + '.';
GO

PRINT 'Here are the 3 most recent audit rows for that test application:';
SELECT TOP 3 * FROM AuditLog ORDER BY AuditId DESC;
GO


PRINT '=========================================================';
PRINT 'TEST 7: Complex query — recruiter dashboard report';
PRINT '=========================================================';
GO

SELECT
    j.JobId, j.Title AS JobTitle, rec.CompanyName,
    COUNT(a.ApplicationId) AS TotalApplicants,
    AVG(a.MatchScore) AS AvgMatchScore,
    MAX(a.MatchScore) AS TopMatchScore
FROM Jobs j
JOIN Recruiters rec ON rec.RecruiterId = j.RecruiterId
LEFT JOIN Applications a ON a.JobId = j.JobId
WHERE j.Status = 'Open'
GROUP BY j.JobId, j.Title, rec.CompanyName
ORDER BY TotalApplicants DESC;
GO


PRINT '=========================================================';
PRINT 'TEST 8: Temp table — candidate/job match percentages';
PRINT '=========================================================';
GO

IF OBJECT_ID('tempdb..#SkillMatches') IS NOT NULL DROP TABLE #SkillMatches;

CREATE TABLE #SkillMatches (
    CandidateId INT NOT NULL,
    JobId INT NOT NULL,
    MatchedSkills INT NOT NULL,
    RequiredSkills INT NOT NULL
);

INSERT INTO #SkillMatches (CandidateId, JobId, MatchedSkills, RequiredSkills)
SELECT
    c.CandidateId, j.JobId,
    COUNT(DISTINCT cs.SkillId) AS MatchedSkills,
    (SELECT COUNT(*) FROM JobSkills WHERE JobId = j.JobId) AS RequiredSkills
FROM Candidates c
CROSS JOIN Jobs j
LEFT JOIN JobSkills js ON js.JobId = j.JobId
LEFT JOIN CandidateSkills cs ON cs.SkillId = js.SkillId AND cs.CandidateId = c.CandidateId
WHERE j.Status = 'Open'
GROUP BY c.CandidateId, j.JobId;

SELECT
    u.FullName AS Candidate, j.Title AS Job,
    sm.MatchedSkills, sm.RequiredSkills,
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


PRINT '=========================================================';
PRINT 'to Candidates, and further down to Resumes and CandidateSkills.';
PRINT 'We will create a throwaway user/candidate/resume, then delete';
PRINT 'the User and confirm everything below it disappeared too.';
PRINT '=========================================================';
GO

DELETE FROM Users WHERE Email = 'cascade.test@example.com';

DECLARE @TestUserId INT;
DECLARE @TestCandId INT;

INSERT INTO Users (FullName, Email, PasswordHash, RoleId)
VALUES ('Cascade Test User', 'cascade.test@example.com', 'hashed_pw_test', 1);

SET @TestUserId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO Candidates (UserId, Phone)
VALUES (@TestUserId, '0000000000');

SET @TestCandId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO Resumes (CandidateId, FileName, FilePath) VALUES (@TestCandId, 'cascade_test.pdf', '/tmp/cascade_test.pdf');

INSERT INTO CandidateSkills (CandidateId, SkillId)
SELECT @TestCandId, SkillId FROM Skills WHERE SkillName = 'Python';


DELETE FROM Users WHERE UserId = @TestUserId;

IF NOT EXISTS (SELECT 1 FROM Candidates WHERE CandidateId = @TestCandId)
   AND NOT EXISTS (SELECT 1 FROM Resumes WHERE CandidateId = @TestCandId)
   AND NOT EXISTS (SELECT 1 FROM CandidateSkills WHERE CandidateId = @TestCandId)
    PRINT 'PASS: deleting the User correctly cascaded down through Candidates, Resumes, and CandidateSkills.';
ELSE
    PRINT 'FAIL: some child rows survived the cascade delete — check ON DELETE CASCADE settings.';
GO


PRINT '=========================================================';
PRINT 'ALL TESTS COMPLETE — scroll up through the Messages tab';
PRINT 'to review every PASS/FAIL line.';
PRINT '=========================================================';
GO

SELECT ApplicationId, JobId, CandidateId FROM Applications;