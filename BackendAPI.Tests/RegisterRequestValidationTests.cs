using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using BackendAPI.Core.Models;
using Xunit;

namespace BackendAPI.Tests;

public class RegisterRequestValidationTests
{
    private static bool IsValid(object model)
    {
        var results = new List<ValidationResult>();
        return Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
    }

    private static CandidateRegisterRequest Candidate(bool acceptedTerms) => new()
    {
        FullName = "Asha Rao",
        Email = "asha@example.com",
        Password = "Strong1!pass",
        Phone = "9876543210",
        AcceptedTerms = acceptedTerms
    };

    private static RecruiterRegisterRequest Recruiter(bool acceptedTerms) => new()
    {
        FullName = "Ravi Kumar",
        Email = "ravi@example.com",
        Password = "Strong1!pass",
        CompanyName = "Acme",
        AcceptedTerms = acceptedTerms
    };

    [Fact]
    public void CandidateRequest_WithTheTermsAccepted_IsValid()
    {
        Assert.True(IsValid(Candidate(true)));
    }

    [Fact]
    public void CandidateRequest_WithoutTheTermsAccepted_IsNotValid()
    {
        Assert.False(IsValid(Candidate(false)));
    }

    [Fact]
    public void RecruiterRequest_WithTheTermsAccepted_IsValid()
    {
        Assert.True(IsValid(Recruiter(true)));
    }

    [Fact]
    public void RecruiterRequest_WithoutTheTermsAccepted_IsNotValid()
    {
        Assert.False(IsValid(Recruiter(false)));
    }

    [Fact]
    public void GoogleRequest_WithoutTheTermsAccepted_IsNotValid()
    {
        Assert.False(IsValid(new GoogleRegisterRequest { IdToken = "token", Role = "candidate", AcceptedTerms = false }));
        Assert.True(IsValid(new GoogleRegisterRequest { IdToken = "token", Role = "candidate", AcceptedTerms = true }));
    }
}
