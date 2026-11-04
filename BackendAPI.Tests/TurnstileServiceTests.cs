using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using BackendAPI.Core.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class TurnstileServiceTests
{
    // Stands in for the internet, so no real call to Cloudflare is made.
    private sealed class FakeHandler : HttpMessageHandler
    {
        private readonly Func<HttpResponseMessage> _respond;

        public FakeHandler(Func<HttpResponseMessage> respond)
        {
            _respond = respond;
        }

        public int Calls { get; private set; }

        public string? LastBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastBody = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return _respond();
        }
    }

    private static TurnstileService CreateService(string? secret, FakeHandler handler)
    {
        var configuration = new Mock<IConfiguration>();
        configuration.Setup(c => c["Turnstile:SecretKey"]).Returns(secret);
        return new TurnstileService(new HttpClient(handler), configuration.Object);
    }

    private static HttpResponseMessage Reply(string body, HttpStatusCode status = HttpStatusCode.OK) =>
        new HttpResponseMessage(status) { Content = new StringContent(body) };

    [Fact]
    public async Task VerifyAsync_NoSecretKey_LetsEveryoneThroughWithoutCallingCloudflare()
    {
        var handler = new FakeHandler(() => Reply("{\"success\": false}"));
        var service = CreateService(null, handler);

        var passed = await service.VerifyAsync(null, "1.2.3.4");

        Assert.True(passed);
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task VerifyAsync_SecretKeySetButNoToken_IsRejectedWithoutCallingCloudflare()
    {
        var handler = new FakeHandler(() => Reply("{\"success\": true}"));
        var service = CreateService("secret", handler);

        var passed = await service.VerifyAsync("", "1.2.3.4");

        Assert.False(passed);
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task VerifyAsync_CloudflareSaysSuccess_Passes()
    {
        var handler = new FakeHandler(() => Reply("{\"success\": true}"));
        var service = CreateService("secret", handler);

        var passed = await service.VerifyAsync("token123", "1.2.3.4");

        Assert.True(passed);
        Assert.Equal(1, handler.Calls);
        Assert.Contains("secret=secret", handler.LastBody);
        Assert.Contains("response=token123", handler.LastBody);
    }

    [Fact]
    public async Task VerifyAsync_CloudflareSaysFailure_IsRejected()
    {
        var handler = new FakeHandler(() => Reply("{\"success\": false}"));
        var service = CreateService("secret", handler);

        Assert.False(await service.VerifyAsync("token123", null));
    }

    [Fact]
    public async Task VerifyAsync_CloudflareServerError_IsRejected()
    {
        var handler = new FakeHandler(() => Reply("{}", HttpStatusCode.InternalServerError));
        var service = CreateService("secret", handler);

        Assert.False(await service.VerifyAsync("token123", null));
    }

    [Fact]
    public async Task VerifyAsync_NetworkError_IsRejected()
    {
        var handler = new FakeHandler(() => throw new HttpRequestException("offline"));
        var service = CreateService("secret", handler);

        Assert.False(await service.VerifyAsync("token123", null));
    }

    [Fact]
    public async Task VerifyAsync_AnswerThatIsNotJson_IsRejected()
    {
        var handler = new FakeHandler(() => Reply("this is not json"));
        var service = CreateService("secret", handler);

        Assert.False(await service.VerifyAsync("token123", null));
    }
}
