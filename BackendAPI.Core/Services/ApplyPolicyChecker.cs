using System;
using System.Collections.Generic;
using System.Globalization;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

public class ApplyPolicyResult
{
    public bool Allowed { get; init; }
    public string Message { get; init; } = string.Empty;
}

// Decides whether a candidate may apply to a job, using the rules the recruiters chose for their own jobs.
// It looks at the candidate's other applications. The rules that count are the ones of the job each earlier application was for.
public static class ApplyPolicyChecker
{
    public static ApplyPolicyResult Check(
        Job target,
        IEnumerable<Application> candidateApplications,
        IDictionary<int, string> statusNames,
        DateTime now)
    {
        foreach (var application in candidateApplications)
        {
            var earlier = application.Job;
            if (earlier == null || earlier.JobId == target.JobId)
            {
                continue;
            }

            var status = StatusOf(application, statusNames);
            var sameRecruiter = earlier.RecruiterId == target.RecruiterId;
            var company = earlier.Recruiter?.CompanyName ?? "this company";
            var isHired = Is(status, "Hired");
            var isRejected = Is(status, "Rejected");

            // Rule 2: after a hire, no new applications for a while.
            if (isHired && earlier.HireLockMonths > 0 && application.DecidedAt.HasValue)
            {
                var lockEnds = application.DecidedAt.Value.AddMonths(earlier.HireLockMonths);
                var isPlatform = earlier.HireLockScope == "Platform";
                if ((isPlatform || sameRecruiter) && now < lockEnds)
                {
                    var place = isPlatform ? "on HireMe AI" : "at " + company;
                    return No("You were hired for '" + earlier.Title + "' at " + company + ". New applications " + place + " are paused until " + Format(lockEnds) + ".");
                }
            }

            // Rule 3: after a rejection, wait before applying to another job of the same recruiter.
            if (isRejected && earlier.RejectWaitDays > 0 && application.DecidedAt.HasValue && sameRecruiter)
            {
                var waitEnds = application.DecidedAt.Value.AddDays(earlier.RejectWaitDays);
                if (now < waitEnds)
                {
                    return No("Your application for '" + earlier.Title + "' at " + company + " was not selected. " + company + " asks you to wait until " + Format(waitEnds) + " before applying to another job there.");
                }
            }

            // Rule 1: one job at a time, until the recruiter replies or the reply deadline passes.
            if (earlier.ExclusiveApplication && sameRecruiter && !isHired && !isRejected)
            {
                if (earlier.ResponseDeadlineDays > 0)
                {
                    var replyBy = application.AppliedAt.AddDays(earlier.ResponseDeadlineDays);
                    if (now < replyBy)
                    {
                        return No(company + " wants candidates to apply to one job at a time. Your application for '" + earlier.Title + "' is still open. You can apply to another job there after they reply, or after " + Format(replyBy) + ".");
                    }
                }
                else
                {
                    return No(company + " wants candidates to apply to one job at a time. Your application for '" + earlier.Title + "' is still open. You can apply to another job there after they reply.");
                }
            }
        }

        return new ApplyPolicyResult { Allowed = true };
    }

    private static string StatusOf(Application application, IDictionary<int, string> statusNames)
    {
        if (application.StatusId.HasValue && statusNames.TryGetValue(application.StatusId.Value, out var name))
        {
            return name;
        }
        return "Applied";
    }

    private static bool Is(string status, string expected) =>
        string.Equals(status, expected, StringComparison.OrdinalIgnoreCase);

    private static string Format(DateTime date) => date.ToString("d MMMM yyyy", CultureInfo.InvariantCulture);

    private static ApplyPolicyResult No(string message) => new ApplyPolicyResult { Allowed = false, Message = message };
}
