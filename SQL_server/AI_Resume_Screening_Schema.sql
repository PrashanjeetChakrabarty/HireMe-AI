/* 
   AI Resume Screening Platform — SQL Server Database Schema
*/ 

IF DB_ID('ResumeScreeningDB') IS NULL
    CREATE DATABASE ResumeScreeningDB;
GO

USE ResumeScreeningDB;
GO

/* 
    Drop existing tables (child -> parent order) 
*/

IF OBJECT_ID('dbo.CandidateEducation', 'U') IS NOT NULL DROP TABLE dbo.CandidateEducation;
IF OBJECT_ID('dbo.CandidateWorkExperience', 'U') IS NOT NULL DROP TABLE dbo.CandidateWorkExperience;
IF OBJECT_ID('dbo.Interviews', 'U') IS NOT NULL DROP TABLE dbo.Interviews;
IF OBJECT_ID('dbo.Applications', 'U') IS NOT NULL DROP TABLE dbo.Applications;
IF OBJECT_ID('dbo.JobSkills', 'U') IS NOT NULL DROP TABLE dbo.JobSkills;
IF OBJECT_ID('dbo.Jobs', 'U') IS NOT NULL DROP TABLE dbo.Jobs;
IF OBJECT_ID('dbo.CandidateSkills', 'U') IS NOT NULL DROP TABLE dbo.CandidateSkills;
IF OBJECT_ID('dbo.Skills', 'U') IS NOT NULL DROP TABLE dbo.Skills;
IF OBJECT_ID('dbo.Resumes', 'U') IS NOT NULL DROP TABLE dbo.Resumes;
IF OBJECT_ID('dbo.Recruiters', 'U') IS NOT NULL DROP TABLE dbo.Recruiters;
IF OBJECT_ID('dbo.Candidates', 'U') IS NOT NULL DROP TABLE dbo.Candidates;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.InterviewStatus', 'U') IS NOT NULL DROP TABLE dbo.InterviewStatus;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

/* 
    Lookup tables  
*/

CREATE TABLE Roles (
    RoleId      INT IDENTITY(1,1) PRIMARY KEY,
    RoleName    NVARCHAR(50) NOT NULL UNIQUE   -- 'Candidate', 'Recruiter', 'Admin'
);
GO

CREATE TABLE InterviewStatus (
    StatusId    INT IDENTITY(1,1) PRIMARY KEY,
    StatusName  NVARCHAR(50) NOT NULL UNIQUE   -- 'Scheduled','Completed','Cancelled','Rescheduled'
);
GO

/*  Core identity tables */

CREATE TABLE Users (
    UserId          INT IDENTITY(1,1) PRIMARY KEY,
    FullName        NVARCHAR(150) NOT NULL,
    Email           NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(256) NOT NULL,
    RoleId          INT NOT NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive        BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);
GO

CREATE TABLE Candidates (
    CandidateId     INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL UNIQUE,
    Phone           NVARCHAR(20) NULL,
    Address         NVARCHAR(250) NULL,
    DateOfBirth     DATE NULL,
    CONSTRAINT FK_Candidates_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
GO

CREATE TABLE Recruiters (
    RecruiterId     INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL UNIQUE,
    CompanyName     NVARCHAR(150) NOT NULL,
    CompanyWebsite  NVARCHAR(200) NULL,
    CONSTRAINT FK_Recruiters_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
GO

/*  Resumes  */

CREATE TABLE Resumes (
    ResumeId        INT IDENTITY(1,1) PRIMARY KEY,
    CandidateId     INT NOT NULL,
    FileName        NVARCHAR(255) NOT NULL,
    FilePath        NVARCHAR(500) NOT NULL,      -- disk / blob storage path
    ParsedText      NVARCHAR(MAX) NULL,          -- text extracted by the FastAPI service
    UploadedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Resumes_Candidates FOREIGN KEY (CandidateId) REFERENCES Candidates(CandidateId) ON DELETE CASCADE
);
GO

/*  Skills  */

CREATE TABLE Skills (
    SkillId     INT IDENTITY(1,1) PRIMARY KEY,
    SkillName   NVARCHAR(100) NOT NULL UNIQUE
);
GO

CREATE TABLE CandidateSkills (
    CandidateId INT NOT NULL,
    SkillId     INT NOT NULL,
    PRIMARY KEY (CandidateId, SkillId),
    CONSTRAINT FK_CandidateSkills_Candidates FOREIGN KEY (CandidateId) REFERENCES Candidates(CandidateId) ON DELETE CASCADE,
    CONSTRAINT FK_CandidateSkills_Skills FOREIGN KEY (SkillId) REFERENCES Skills(SkillId) ON DELETE CASCADE
);
GO

/*  Candidate Education & Work Experience (AI-extracted, structured resume data)  */

CREATE TABLE CandidateEducation (
    EducationId     INT IDENTITY(1,1) PRIMARY KEY,
    CandidateId     INT NOT NULL,
    Degree          NVARCHAR(255) NULL,
    Institution     NVARCHAR(255) NULL,
    [Year]          NVARCHAR(50) NULL,
    CONSTRAINT FK_CandidateEducation_Candidates FOREIGN KEY (CandidateId) REFERENCES Candidates(CandidateId) ON DELETE CASCADE
);
GO

CREATE TABLE CandidateWorkExperience (
    WorkExperienceId    INT IDENTITY(1,1) PRIMARY KEY,
    CandidateId         INT NOT NULL,
    Company              NVARCHAR(255) NULL,
    [Role]               NVARCHAR(255) NULL,
    Duration             NVARCHAR(100) NULL,
    CONSTRAINT FK_CandidateWorkExperience_Candidates FOREIGN KEY (CandidateId) REFERENCES Candidates(CandidateId) ON DELETE CASCADE
);
GO

/*  Jobs  */

CREATE TABLE Jobs (
    JobId           INT IDENTITY(1,1) PRIMARY KEY,
    RecruiterId     INT NOT NULL,
    Title           NVARCHAR(150) NOT NULL,
    Description     NVARCHAR(MAX) NOT NULL,
    Location        NVARCHAR(150) NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Open',   -- Open / Closed
    PostedAt        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Jobs_Recruiters FOREIGN KEY (RecruiterId) REFERENCES Recruiters(RecruiterId) ON DELETE CASCADE
);
GO

CREATE TABLE JobSkills (
    JobId       INT NOT NULL,
    SkillId     INT NOT NULL,
    PRIMARY KEY (JobId, SkillId),
    CONSTRAINT FK_JobSkills_Jobs FOREIGN KEY (JobId) REFERENCES Jobs(JobId) ON DELETE CASCADE,
    CONSTRAINT FK_JobSkills_Skills FOREIGN KEY (SkillId) REFERENCES Skills(SkillId) ON DELETE CASCADE
);
GO

/*  Applications  */

CREATE TABLE Applications (
    ApplicationId   INT IDENTITY(1,1) PRIMARY KEY,
    JobId           INT NOT NULL,
    CandidateId     INT NOT NULL,
    ResumeId        INT NOT NULL,
    AppliedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    MatchScore      DECIMAL(5,2) NULL,       -- AI compatibility score like 80.00%
    StatusId        INT NULL,                -- current interview/application status
    CONSTRAINT FK_Applications_Jobs FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    CONSTRAINT FK_Applications_Candidates FOREIGN KEY (CandidateId) REFERENCES Candidates(CandidateId),
    CONSTRAINT FK_Applications_Resumes FOREIGN KEY (ResumeId) REFERENCES Resumes(ResumeId),
    CONSTRAINT FK_Applications_Status FOREIGN KEY (StatusId) REFERENCES InterviewStatus(StatusId),
    CONSTRAINT UQ_Applications_JobCandidate UNIQUE (JobId, CandidateId)   -- one application per job per candidate
);
GO

/*  Interviews  */

CREATE TABLE Interviews (
    InterviewId     INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationId   INT NOT NULL,
    ScheduledAt     DATETIME2 NULL,
    Mode            NVARCHAR(20) NULL,   -- Online / In-person / Phone
    RecruiterComments NVARCHAR(MAX) NULL,
    StatusId        INT NOT NULL,
    CONSTRAINT FK_Interviews_Applications FOREIGN KEY (ApplicationId) REFERENCES Applications(ApplicationId) ON DELETE CASCADE,
    CONSTRAINT FK_Interviews_Status FOREIGN KEY (StatusId) REFERENCES InterviewStatus(StatusId)
);
GO

/* Helpful indexes */

CREATE INDEX IX_Resumes_CandidateId ON Resumes(CandidateId);
CREATE INDEX IX_Applications_JobId ON Applications(JobId);
CREATE INDEX IX_Applications_CandidateId ON Applications(CandidateId);
CREATE INDEX IX_Jobs_RecruiterId ON Jobs(RecruiterId);
CREATE INDEX IX_CandidateEducation_CandidateId ON CandidateEducation(CandidateId);
CREATE INDEX IX_CandidateWorkExperience_CandidateId ON CandidateWorkExperience(CandidateId);
GO

/* Seed data (lookup tables) */

INSERT INTO Roles (RoleName) VALUES ('Candidate'), ('Recruiter'), ('Admin');
INSERT INTO InterviewStatus (StatusName) VALUES ('Applied'), ('Shortlisted'), ('Scheduled'), ('Completed'), ('Rejected'), ('Hired');
GO