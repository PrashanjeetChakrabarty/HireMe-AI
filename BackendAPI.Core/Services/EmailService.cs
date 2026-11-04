using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace BackendAPI.Core.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // The address replies go to (the project mailbox). It is null when no ReplyTo is set.
    public static MailboxAddress? ReplyToFrom(IConfiguration configuration)
    {
        var address = configuration.GetSection("SmtpSettings")["ReplyTo"];
        return string.IsNullOrWhiteSpace(address) ? null : new MailboxAddress("HireMe AI", address.Trim());
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        var host = smtpSettings["Host"];
        var port = int.Parse(smtpSettings["Port"] ?? "587");
        var username = smtpSettings["Username"];
        var password = smtpSettings["Password"];
        var fromEmail = smtpSettings["FromEmail"];
        var fromName = smtpSettings["FromName"];

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        var replyTo = ReplyToFrom(_configuration);
        if (replyTo != null)
        {
            message.ReplyTo.Add(replyTo);
        }
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        // Send the professional HTML email together with a plain text copy, for email apps that do not show HTML.
        // If the HTML ever fails to build, the plain message is sent instead, so no email is lost.
        try
        {
            var content = EmailTemplate.Build(subject, body, EmailBranding.FromConfiguration(_configuration));
            var builder = new BodyBuilder { TextBody = content.Text, HtmlBody = content.Html };
            message.Body = builder.ToMessageBody();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Email template failed, sending plain text: {ex.Message}");
            message.Body = new TextPart("plain") { Text = body };
        }

        using var client = new SmtpClient();

        // Development-only: skip strict SSL certificate revocation checks.
        // This mirrors "TrustServerCertificate" for SQL Server — needed
        // locally because some networks can't complete a revocation check,
        // not needed once deployed to a real server (Phase H / production).
        client.ServerCertificateValidationCallback = (s, c, h, e) => true;

        try
        {
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Email send failed to {toEmail}: {ex.Message}");
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}