using System;
using Microsoft.EntityFrameworkCore;
using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Role> Roles { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Candidate> Candidates { get; set; }
    public DbSet<Recruiter> Recruiters { get; set; }
    public DbSet<Resume> Resumes { get; set; }
    public DbSet<Skill> Skills { get; set; }
    public DbSet<Job> Jobs { get; set; }
    public DbSet<Application> Applications { get; set; }
    public DbSet<Interview> Interviews { get; set; }
    public DbSet<CandidateEducation> CandidateEducations { get; set; }
    public DbSet<CandidateWorkExperience> CandidateWorkExperiences { get; set; }
    public DbSet<InterviewStatus> InterviewStatuses { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<ConsentLog> ConsentLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Job>()
            .Property(j => j.HireLockScope)
            .HasMaxLength(20)
            .HasDefaultValue("Recruiter");

        modelBuilder.Entity<Job>()
            .Property(j => j.ResponseDeadlineDays)
            .HasDefaultValue(14);

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Candidate>()
            .HasOne(c => c.User)
            .WithOne()
            .HasForeignKey<Candidate>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Recruiter>()
            .HasOne(r => r.User)
            .WithOne()
            .HasForeignKey<Recruiter>(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Resume>()
            .HasOne(r => r.Candidate)
            .WithMany()
            .HasForeignKey(r => r.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Job>()
            .HasOne(j => j.Recruiter)
            .WithMany()
            .HasForeignKey(j => j.RecruiterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Application>()
            .HasIndex(a => new { a.JobId, a.CandidateId })
            .IsUnique();

        modelBuilder.Entity<Application>()
            .ToTable(tb => tb.UseSqlOutputClause(false));

        modelBuilder.Entity<Candidate>()
            .HasMany(c => c.CandidateSkills)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "CandidateSkills",
                j => j.HasOne<Skill>().WithMany().HasForeignKey("SkillId"),
                l => l.HasOne<Candidate>().WithMany().HasForeignKey("CandidateId")
            );

        modelBuilder.Entity<Job>()
            .HasMany(j => j.RequiredSkills)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "JobSkills",
                j => j.HasOne<Skill>().WithMany().HasForeignKey("SkillId"),
                l => l.HasOne<Job>().WithMany().HasForeignKey("JobId")
            );

        modelBuilder.Entity<CandidateEducation>()
            .HasKey(e => e.EducationId);

        modelBuilder.Entity<CandidateEducation>()
            .ToTable("CandidateEducation");

        modelBuilder.Entity<CandidateEducation>()
            .HasOne<Candidate>()
            .WithMany()
            .HasForeignKey(e => e.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CandidateWorkExperience>()
            .HasKey(w => w.WorkExperienceId);

        modelBuilder.Entity<CandidateWorkExperience>()
            .ToTable("CandidateWorkExperience");

        modelBuilder.Entity<CandidateWorkExperience>()
            .HasOne<Candidate>()
            .WithMany()
            .HasForeignKey(w => w.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InterviewStatus>()
            .HasKey(s => s.StatusId);

        modelBuilder.Entity<InterviewStatus>()
            .ToTable("InterviewStatus");

        modelBuilder.Entity<AuditLog>()
            .HasKey(a => a.AuditId);

        modelBuilder.Entity<AuditLog>()
            .ToTable("AuditLog");

        modelBuilder.Entity<ConsentLog>()
            .HasKey(c => c.ConsentLogId);

        modelBuilder.Entity<ConsentLog>()
            .ToTable("ConsentLog");

        modelBuilder.Entity<ConsentLog>()
            .Property(c => c.ConsentType)
            .HasMaxLength(40);

        modelBuilder.Entity<ConsentLog>()
            .Property(c => c.Version)
            .HasMaxLength(20);

        modelBuilder.Entity<ConsentLog>()
            .Property(c => c.VisitorId)
            .HasMaxLength(64);

        modelBuilder.Entity<ConsentLog>()
            .HasIndex(c => c.AcceptedAt);

        modelBuilder.Entity<ConsentLog>()
            .HasIndex(c => new { c.VisitorId, c.ConsentType, c.Version });
    }
}