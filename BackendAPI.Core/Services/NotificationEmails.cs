using System;
using System.Collections.Generic;
using System.Globalization;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class NotificationMessage
{
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

// The text of the emails that tell a person about something that happened. The professional layout is added by EmailTemplate.
public static class NotificationEmails
{
    private const string SignOff = "\n\nThanks,\nHireMe AI Team";

    public static NotificationMessage Welcome(string fullName, string? roleName)
    {
        string intro;
        string steps;
        if (string.Equals(roleName, "Recruiter", StringComparison.OrdinalIgnoreCase))
        {
            intro = "Welcome to HireMe AI! Your recruiter account is verified and ready to use.";
            steps = "Here is how to get started:\n"
                + "1. Post your first job from My Jobs. Describe the role and choose your application rules.\n"
                + "2. Review the applicants, ranked by their AI match score.\n"
                + "3. Shortlist the best candidates and schedule interviews, all in one place.";
        }
        else if (string.Equals(roleName, "Candidate", StringComparison.OrdinalIgnoreCase))
        {
            intro = "Welcome to HireMe AI! Your account is verified and ready to use.";
            steps = "Here is how to get started:\n"
                + "1. Upload your resume in My Resumes. Our AI reads it and builds your skills profile.\n"
                + "2. Browse the open jobs. Each job shows its application rules before you apply.\n"
                + "3. Apply, then follow your match score, interviews and status on your dashboard.";
        }
        else
        {
            intro = "Welcome to HireMe AI! Your account is verified and ready to use.";
            steps = "Sign in to your dashboard to get started.";
        }

        return new NotificationMessage
        {
            Subject = "Welcome to HireMe AI",
            Body = "Hi " + fullName + ",\n\n" + intro + "\n\n" + steps + SignOff
        };
    }

    public static NotificationMessage AccountDeleted(string fullName)
    {
        return new NotificationMessage
        {
            Subject = "Your HireMe AI account has been deleted",
            Body = "Hi " + fullName + ",\n\n"
                + "Your HireMe AI account has been deleted, as you asked. Your profile, resumes, applications and interviews have been removed.\n\n"
                + "If you did not ask for this, please contact us right away.\n\n"
                + "We are sorry to see you go. You are always welcome to create a new account." + SignOff
        };
    }

    public static NotificationMessage PasswordChanged(string fullName)
    {
        return new NotificationMessage
        {
            Subject = "Your password was changed",
            Body = "Hi " + fullName + ",\n\n"
                + "The password of your HireMe AI account was just changed.\n\n"
                + "If you made this change, you do not need to do anything.\n\n"
                + "If you did not, please use \"Forgot password\" on the login page to set a new one right away, and contact us." + SignOff
        };
    }

    public static NotificationMessage JobPosted(string recruiterName, Job job)
    {
        var rules = string.Empty;
        foreach (var line in RuleLines(job))
        {
            rules += "- " + line + "\n";
        }

        return new NotificationMessage
        {
            Subject = "Your job is live: " + job.Title,
            Body = "Hi " + recruiterName + ",\n\n"
                + "Your job \"" + job.Title + "\" is now live. Candidates can see it and apply.\n\n"
                + "The application rules you chose:\n" + rules.TrimEnd('\n') + "\n\n"
                + "You can follow the applicants, shortlist the best and schedule interviews from My Jobs." + SignOff
        };
    }

    public static NotificationMessage NewApplicant(string recruiterName, string candidateName, string jobTitle, decimal? matchScore)
    {
        var score = matchScore.HasValue
            ? "AI match score: " + matchScore.Value.ToString("0.#", CultureInfo.InvariantCulture) + "%"
            : "AI match score: not available yet";

        return new NotificationMessage
        {
            Subject = "New applicant for " + jobTitle,
            Body = "Hi " + recruiterName + ",\n\n"
                + candidateName + " has applied for \"" + jobTitle + "\".\n\n"
                + score + "\n\n"
                + "Open My Jobs to read the profile and the resume, and to shortlist or reply." + SignOff
        };
    }

    // The job rules in plain words, written for the recruiter who chose them.
    public static List<string> RuleLines(Job job)
    {
        var lines = new List<string>();
        if (job.ExclusiveApplication)
        {
            lines.Add("One job at a time: a candidate with an open application to one of your jobs cannot apply to your other jobs until you reply.");
        }
        if (job.HireLockMonths > 0)
        {
            lines.Add(job.HireLockScope == "Platform"
                ? "After a hire, the candidate cannot apply for any job on HireMe AI for " + job.HireLockMonths + " months."
                : "After a hire, the candidate cannot apply to your other jobs for " + job.HireLockMonths + " months.");
        }
        if (job.RejectWaitDays > 0)
        {
            lines.Add("After a rejection, the candidate cannot apply to your other jobs for " + job.RejectWaitDays + " days.");
        }
        if (lines.Count == 0)
        {
            lines.Add("No extra restrictions.");
        }
        if (job.ResponseDeadlineDays > 0)
        {
            lines.Add("You promised to reply within " + job.ResponseDeadlineDays + " days.");
        }
        return lines;
    }
}
