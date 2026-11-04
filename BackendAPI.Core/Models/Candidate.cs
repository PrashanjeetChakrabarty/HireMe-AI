using System;
using System.Collections.Generic;

namespace BackendAPI.Core.Models;

public class Candidate
{
    public int CandidateId { get; set; }
    public int UserId { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }

    // Relationships
    public User? User { get; set; }
    public ICollection<Skill> CandidateSkills { get; set; } = new List<Skill>();
}