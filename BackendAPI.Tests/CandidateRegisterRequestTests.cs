using System.ComponentModel.DataAnnotations;
using BackendAPI.Core.Models;
using Xunit;

namespace BackendAPI.Tests;

public class CandidateRegisterRequestTests
{
    // Helper: [Required], [RegularExpression] jaise DataAnnotations
    // ko manually trigger karta hai, jaisa ASP.NET Core khud karta hai.
    private static IList<ValidationResult> Validate(CandidateRegisterRequest request)
    {
        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, context, results, validateAllProperties: true);
        return results;
    }

    [Theory]
    [InlineData("name@example.com")]
    [InlineData("test.user+tag@company.co.in")]
    public void Email_ValidFormats_PassValidation(string email)
    {
        var request = new CandidateRegisterRequest
        {
            FullName = "Test User",
            Email = email,
            Password = "Passw0rd!",
            Phone = "9876543210"
        };

        var results = Validate(request);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(request.Email)));
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("missing@domain")]
    [InlineData("@nodomain.com")]
    public void Email_InvalidFormats_FailValidation(string email)
    {
        var request = new CandidateRegisterRequest
        {
            FullName = "Test User",
            Email = email,
            Password = "Passw0rd!",
            Phone = "9876543210"
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(request.Email)));
    }

    [Theory]
    [InlineData("short1!")]      // 8 se kam characters
    [InlineData("alllowercase1!")] // capital letter missing
    [InlineData("NoNumber!")]     // number missing
    [InlineData("NoSpecial123")]  // special character missing
    public void Password_WeakPasswords_FailValidation(string password)
    {
        var request = new CandidateRegisterRequest
        {
            FullName = "Test User",
            Email = "valid@example.com",
            Password = password,
            Phone = "9876543210"
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(request.Password)));
    }

    [Fact]
    public void Password_StrongPassword_PassesValidation()
    {
        var request = new CandidateRegisterRequest
        {
            FullName = "Test User",
            Email = "valid@example.com",
            Password = "Passw0rd!",
            Phone = "9876543210"
        };

        var results = Validate(request);

        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(request.Password)));
    }
}