/* schema_patches.sql — Records every one-off column/table change made
   directly in DBeaver, so a DB reset never loses them again.
   Safe to run any number of times: each block checks first, only
   makes the change if it's actually missing. */

USE ResumeScreeningDB;
GO

/* Users.OtpCode — used by OTP registration/login verification */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'OtpCode'
)
    ALTER TABLE Users ADD OtpCode NVARCHAR(10) NULL;
GO

/* Users.OtpExpiry — used by OTP registration/login verification */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'OtpExpiry'
)
    ALTER TABLE Users ADD OtpExpiry DATETIME2 NULL;
GO

/* Interviews.Venue — address / meeting link / phone number for a scheduled interview */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Interviews') AND name = 'Venue'
)
    ALTER TABLE Interviews ADD Venue NVARCHAR(255) NULL;
GO

/* Applications.ShortlistedAt — timestamp set when a candidate is shortlisted */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Applications') AND name = 'ShortlistedAt'
)
    ALTER TABLE Applications ADD ShortlistedAt DATETIME2 NULL;
GO