using System;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace BackendAPI.Core.Services;

// The names and links shown in the header and footer of every email.
public class EmailBranding
{
    public string CompanyName { get; set; } = "HireMe AI";
    public string LegalName { get; set; } = "HireMe AI";
    public string ProductName { get; set; } = "AI Resume Screener";
    public string WebsiteUrl { get; set; } = "https://hireme-ai-hiring.vercel.app";
    public string Address { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;

    public static EmailBranding FromConfiguration(IConfiguration configuration)
    {
        var branding = new EmailBranding();
        branding.CompanyName = Pick(configuration["EmailBranding:CompanyName"], branding.CompanyName);
        branding.LegalName = Pick(configuration["EmailBranding:LegalName"], branding.LegalName);
        branding.ProductName = Pick(configuration["EmailBranding:ProductName"], branding.ProductName);
        branding.WebsiteUrl = Pick(configuration["EmailBranding:WebsiteUrl"], branding.WebsiteUrl).TrimEnd('/');
        branding.Address = Pick(configuration["EmailBranding:Address"], branding.Address);
        branding.SupportEmail = Pick(configuration["EmailBranding:SupportEmail"], branding.SupportEmail);
        return branding;
    }

    private static string Pick(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}

public class EmailContent
{
    public string Html { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

// Turns the plain text message that each part of the app writes into a professional HTML email.
public static class EmailTemplate
{
    private const string Font = "font-family:'Segoe UI',Helvetica,Arial,sans-serif;";

    public static EmailContent Build(string subject, string body, EmailBranding branding)
    {
        subject ??= string.Empty;
        var text = (body ?? string.Empty).Replace("\r\n", "\n").Trim();
        var paragraphs = Regex.Split(text, @"\n\s*\n")
            .Select(p => p.Trim())
            .Where(p => p.Length > 0)
            .ToList();

        // Every message ends with "Thanks,\nHireMe AI Team" (or similar). The template adds one sign-off of its own.
        var signOffLead = "Warm regards,";
        if (paragraphs.Count > 1)
        {
            var lines = paragraphs[paragraphs.Count - 1].Split('\n').Select(l => l.Trim()).ToArray();
            if (lines.Length == 2 && lines[1].Equals("HireMe AI Team", StringComparison.OrdinalIgnoreCase))
            {
                signOffLead = lines[0];
                paragraphs.RemoveAt(paragraphs.Count - 1);
            }
        }

        var isCodeEmail = Regex.IsMatch(subject, "code|verif|otp|reset", RegexOptions.IgnoreCase);
        var website = branding.WebsiteUrl;
        var firstIsGreeting = paragraphs.Count > 0 && Regex.IsMatch(paragraphs[0], @"^(Hi|Hello|Dear)\b[^\n]*,$");
        var preview = paragraphs.Skip(firstIsGreeting ? 1 : 0).FirstOrDefault() ?? subject;
        if (preview.Length > 110)
        {
            preview = preview.Substring(0, 110);
        }

        var html = new StringBuilder();
        html.Append("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">");
        html.Append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
        html.Append("<title>").Append(Encode(subject)).Append("</title></head>");
        html.Append("<body style=\"margin:0;padding:0;background-color:#eef2f4;\">");
        html.Append("<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">").Append(Encode(preview)).Append("</div>");
        html.Append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#eef2f4;padding:24px 12px;\"><tr><td align=\"center\">");
        html.Append("<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;\">");

        // Header
        html.Append("<tr><td style=\"background-color:#0f3d3e;padding:24px 32px;border-radius:12px 12px 0 0;\">");
        html.Append("<span style=\"").Append(Font).Append("font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;\">").Append(Encode(branding.CompanyName)).Append("</span><br>");
        html.Append("<span style=\"").Append(Font).Append("font-size:12px;color:#9ad1cf;letter-spacing:1.5px;text-transform:uppercase;\">").Append(Encode(branding.ProductName)).Append("</span>");
        html.Append("</td></tr>");

        // Message
        html.Append("<tr><td style=\"background-color:#ffffff;padding:32px;").Append(Font).Append("\">");
        html.Append("<h1 style=\"margin:0 0 20px;font-size:20px;line-height:28px;color:#0f172a;").Append(Font).Append("\">").Append(Encode(subject)).Append("</h1>");
        for (var i = 0; i < paragraphs.Count; i++)
        {
            var encoded = Encode(paragraphs[i]).Replace("\n", "<br>");
            if (isCodeEmail)
            {
                encoded = Regex.Replace(
                    encoded,
                    @"\b(\d{6})\b",
                    match => "<span style=\"display:inline-block;margin:4px 0;padding:6px 14px;background-color:#e6f4f3;border-radius:8px;font-family:Consolas,'Courier New',monospace;font-size:24px;font-weight:700;letter-spacing:6px;color:#0f3d3e;\">" + match.Value + "</span>");
            }
            var weight = i == 0 && firstIsGreeting ? "font-weight:600;color:#0f172a;" : "color:#334155;";
            html.Append("<p style=\"margin:0 0 16px;font-size:15px;line-height:24px;").Append(weight).Append(Font).Append("\">").Append(encoded).Append("</p>");
        }
        if (!isCodeEmail)
        {
            html.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:8px 0 24px;\"><tr>");
            html.Append("<td style=\"background-color:#0f766e;border-radius:999px;\"><a href=\"").Append(Encode(website)).Append("/dashboard\" style=\"display:inline-block;padding:12px 28px;").Append(Font).Append("font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;\">Go to my dashboard</a></td>");
            html.Append("</tr></table>");
        }
        html.Append("<p style=\"margin:8px 0 0;font-size:15px;line-height:24px;color:#334155;").Append(Font).Append("\">").Append(Encode(signOffLead)).Append("<br><strong style=\"color:#0f172a;\">The ").Append(Encode(branding.CompanyName)).Append(" Team</strong></p>");
        html.Append("</td></tr>");

        // Footer
        html.Append("<tr><td style=\"background-color:#f8fafb;padding:20px 32px;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;").Append(Font).Append("font-size:12px;line-height:19px;color:#64748b;\">");
        html.Append("<strong style=\"color:#334155;\">").Append(Encode(branding.LegalName)).Append("</strong>");
        if (branding.Address.Length > 0)
        {
            html.Append("<br>").Append(Encode(branding.Address));
        }
        if (branding.SupportEmail.Length > 0)
        {
            html.Append("<br>Support: <a href=\"mailto:").Append(Encode(branding.SupportEmail)).Append("\" style=\"color:#0f766e;\">").Append(Encode(branding.SupportEmail)).Append("</a>");
        }
        html.Append("<br><a href=\"").Append(Encode(website)).Append("\" style=\"color:#0f766e;\">").Append(Encode(website)).Append("</a>");
        html.Append(" &nbsp;|&nbsp; <a href=\"").Append(Encode(website)).Append("/terms\" style=\"color:#0f766e;\">Terms of Service</a>");
        html.Append(" &nbsp;|&nbsp; <a href=\"").Append(Encode(website)).Append("/privacy\" style=\"color:#0f766e;\">Privacy Policy</a>");
        html.Append("<br><br>This is an automated message from ").Append(Encode(branding.CompanyName)).Append(". Please do not reply to it.");
        html.Append("<br>&copy; ").Append(DateTime.UtcNow.Year).Append(" ").Append(Encode(branding.LegalName)).Append(". All rights reserved.");
        html.Append("</td></tr>");

        html.Append("</table></td></tr></table></body></html>");

        var plain = new StringBuilder();
        plain.Append(text);
        plain.Append("\n\n--\n").Append(branding.LegalName);
        if (branding.Address.Length > 0)
        {
            plain.Append("\n").Append(branding.Address);
        }
        plain.Append("\n").Append(website);
        if (branding.SupportEmail.Length > 0)
        {
            plain.Append("\nSupport: ").Append(branding.SupportEmail);
        }
        plain.Append("\nTerms: ").Append(website).Append("/terms  |  Privacy: ").Append(website).Append("/privacy");
        plain.Append("\nThis is an automated message from ").Append(branding.CompanyName).Append(". Please do not reply to it.");

        return new EmailContent { Html = html.ToString(), Text = plain.ToString() };
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);
}
