using System;
using System.Globalization;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Services;

// Short sentences about the job rules, added to the emails a candidate gets about an application.
// Each one is empty, or starts with a blank line, so it can be dropped straight into a message.
public static class ApplicationEmailNotes
{
    public static string AppliedNote(Job job)
    {
        var lines = string.Empty;
        if (job.ResponseDeadlineDays > 0)
        {
            lines += "\n\nThe recruiter has promised to reply within " + job.ResponseDeadlineDays + " days.";
        }
        if (job.ExclusiveApplication)
        {
            lines += "\n\nPlease note: this company accepts one open application at a time. You can apply to its other jobs after they reply";
            lines += job.ResponseDeadlineDays > 0 ? ", or once " + job.ResponseDeadlineDays + " days have passed." : ".";
        }
        return lines;
    }

    // Used in the middle of a message, so it has no blank line in front.
    public static string RejectedNote(Job job, DateTime? decidedAt)
    {
        if (job.RejectWaitDays > 0 && decidedAt.HasValue)
        {
            var company = job.Recruiter?.CompanyName ?? "This company";
            var until = decidedAt.Value.AddDays(job.RejectWaitDays);
            return company + " asks candidates to wait until " + Format(until) + " before applying to another of their jobs. You can still apply to jobs at other companies right away.";
        }
        return "We encourage you to apply for other roles that match your profile.";
    }

    public static string HiredNote(Job job, DateTime? decidedAt)
    {
        if (job.HireLockMonths <= 0 || !decidedAt.HasValue)
        {
            return string.Empty;
        }
        var until = decidedAt.Value.AddMonths(job.HireLockMonths);
        var place = job.HireLockScope == "Platform" ? "on HireMe AI" : "at " + (job.Recruiter?.CompanyName ?? "this company");
        return "\n\nAs agreed in the rules of this job, new applications " + place + " are paused until " + Format(until) + ".";
    }

    private static string Format(DateTime date) => date.ToString("d MMMM yyyy", CultureInfo.InvariantCulture);
}
