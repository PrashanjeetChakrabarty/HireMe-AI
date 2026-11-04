using System;
using System.Threading.Tasks;
using BackendAPI.Core.Models;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Moq;
using Xunit;

namespace BackendAPI.Tests;

public class ConsentServiceTests
{
    [Fact]
    public async Task RecordTermsAcceptedAsync_AddsOneRowForTheUser()
    {
        var repository = new Mock<IConsentLogRepository>();
        ConsentLog? saved = null;
        repository.Setup(r => r.AddAsync(It.IsAny<ConsentLog>()))
            .Callback<ConsentLog>(entry => saved = entry)
            .Returns(Task.CompletedTask);
        var service = new ConsentService(repository.Object);

        await service.RecordTermsAcceptedAsync(7);

        Assert.NotNull(saved);
        Assert.Equal(7, saved!.UserId);
        Assert.Null(saved.VisitorId);
        Assert.Equal("terms-and-privacy", saved.ConsentType);
        Assert.Equal(ConsentInfo.CurrentVersion, saved.Version);
    }

    [Fact]
    public async Task RecordStorageNoticeAsync_NewVisitor_AddsOneRowWithoutAUser()
    {
        var repository = new Mock<IConsentLogRepository>();
        ConsentLog? saved = null;
        repository.Setup(r => r.AddAsync(It.IsAny<ConsentLog>()))
            .Callback<ConsentLog>(entry => saved = entry)
            .Returns(Task.CompletedTask);
        var service = new ConsentService(repository.Object);

        var recorded = await service.RecordStorageNoticeAsync("abc123");

        Assert.True(recorded);
        Assert.NotNull(saved);
        Assert.Equal("abc123", saved!.VisitorId);
        Assert.Null(saved.UserId);
        Assert.Equal("storage-notice", saved.ConsentType);
    }

    [Fact]
    public async Task RecordStorageNoticeAsync_SameVisitorAgain_DoesNotAddASecondRow()
    {
        var repository = new Mock<IConsentLogRepository>();
        repository.Setup(r => r.ExistsForVisitorAsync("abc123", "storage-notice", ConsentInfo.CurrentVersion))
            .ReturnsAsync(true);
        var service = new ConsentService(repository.Object);

        var recorded = await service.RecordStorageNoticeAsync("abc123");

        Assert.True(recorded);
        repository.Verify(r => r.AddAsync(It.IsAny<ConsentLog>()), Times.Never);
    }

    [Fact]
    public async Task RecordStorageNoticeAsync_TooManyRecentRows_ReturnsFalseAndAddsNothing()
    {
        var repository = new Mock<IConsentLogRepository>();
        repository.Setup(r => r.CountSinceAsync("storage-notice", It.IsAny<DateTime>()))
            .ReturnsAsync(2000);
        var service = new ConsentService(repository.Object);

        var recorded = await service.RecordStorageNoticeAsync("abc123");

        Assert.False(recorded);
        repository.Verify(r => r.AddAsync(It.IsAny<ConsentLog>()), Times.Never);
    }
}
