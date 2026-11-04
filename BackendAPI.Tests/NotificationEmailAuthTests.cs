using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class NotificationEmailAuthTests
{
    [Fact]
    public void PasswordChanged_TellsTheOwnerWhatToDoIfItWasNotThem()
    {
        var message = NotificationEmails.PasswordChanged("Asha");

        Assert.Equal("Your password was changed", message.Subject);
        Assert.Contains("Hi Asha,", message.Body);
        Assert.Contains("was just changed", message.Body);
        Assert.Contains("Forgot password", message.Body);
    }

    [Fact]
    public void PasswordChanged_EndsWithTheTeamSignOffSoTheTemplateCanReplaceIt()
    {
        var message = NotificationEmails.PasswordChanged("Asha");

        Assert.EndsWith("Thanks,\nHireMe AI Team", message.Body);
    }
}
