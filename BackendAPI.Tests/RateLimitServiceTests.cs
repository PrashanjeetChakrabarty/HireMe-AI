using BackendAPI.Core.Services;
using Xunit;

namespace BackendAPI.Tests;

public class RateLimitServiceTests
{
    // 1. Bilkul naya email — pehli baar rate limit check karne par
    //    allowed hona chahiye (kyunki koi purani failed attempt nahi hai).
    [Fact]
    public void CheckLogin_NewEmail_IsAllowed()
    {
        var service = new RateLimitService();

        var (allowed, secondsRemaining) = service.CheckLogin("newuser@example.com");

        Assert.True(allowed);
        Assert.Equal(0, secondsRemaining);
    }

    // 2. 4 baar galat password (failed login) record karne ke baad bhi
    //    5th attempt allowed hona chahiye — limit abhi cross nahi hui.
    [Fact]
    public void CheckLogin_AfterFourFailedAttempts_StillAllowed()
    {
        var service = new RateLimitService();
        var email = "test4fails@example.com";

        for (int i = 0; i < 4; i++)
        {
            service.RecordFailedLogin(email);
        }

        var (allowed, _) = service.CheckLogin(email);

        Assert.True(allowed);
    }

    // 3. 5 baar galat password record karne ke baad, 6th attempt
    //    BLOCK ho jana chahiye (429 Too Many Attempts wala scenario).
    [Fact]
    public void CheckLogin_AfterFiveFailedAttempts_IsBlocked()
    {
        var service = new RateLimitService();
        var email = "test5fails@example.com";

        for (int i = 0; i < 5; i++)
        {
            service.RecordFailedLogin(email);
        }

        var (allowed, secondsRemaining) = service.CheckLogin(email);

        Assert.False(allowed);
        Assert.True(secondsRemaining > 0);
    }

    // 4. Successful login ke baad ResetLogin() call hota hai — isse
    //    purani failed attempts count clear ho jani chahiye.
    [Fact]
    public void ResetLogin_ClearsFailedAttempts()
    {
        var service = new RateLimitService();
        var email = "willreset@example.com";

        for (int i = 0; i < 5; i++)
        {
            service.RecordFailedLogin(email);
        }

        service.ResetLogin(email);
        var (allowed, _) = service.CheckLogin(email);

        Assert.True(allowed);
    }
}