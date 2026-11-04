using BackendAPI.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Core.Repository;

public class SkillRepository : ISkillRepository
{
    private readonly ApplicationDbContext _context;

    public SkillRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddSkillsToCandidateAsync(int candidateId, List<string> skillNames)
    {
        if (skillNames == null || skillNames.Count == 0)
        {
            return;
        }

        // Load the candidate with its currently-linked skills so EF Core
        // can figure out which ones are already linked (avoids duplicates
        // in the CandidateSkills join table).
        var candidate = await _context.Candidates
            .Include(c => c.CandidateSkills)
            .FirstOrDefaultAsync(c => c.CandidateId == candidateId);

        if (candidate == null)
        {
            return;
        }

        foreach (var rawSkillName in skillNames)
        {
            var skillName = rawSkillName.Trim();
            if (string.IsNullOrEmpty(skillName))
            {
                continue;
            }

            // Case-insensitive lookup so "python" and "Python" are treated
            // as the same skill instead of creating duplicates.
            var existingSkill = await _context.Skills
                .FirstOrDefaultAsync(s => s.SkillName.ToLower() == skillName.ToLower());

            Skill skill;
            if (existingSkill != null)
            {
                skill = existingSkill;
            }
            else
            {
                skill = new Skill { SkillName = skillName };
                await _context.Skills.AddAsync(skill);
                await _context.SaveChangesAsync(); // save now so skill.SkillId is populated
            }

            // Only link if this candidate doesn't already have this skill.
            var alreadyLinked = candidate.CandidateSkills.Any(s => s.SkillId == skill.SkillId);
            if (!alreadyLinked)
            {
                candidate.CandidateSkills.Add(skill);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<string>> GetSkillsByCandidateIdAsync(int candidateId)
    {
        var candidate = await _context.Candidates
            .Include(c => c.CandidateSkills)
            .FirstOrDefaultAsync(c => c.CandidateId == candidateId);

        return candidate?.CandidateSkills.Select(s => s.SkillName).ToList() ?? new List<string>();
    }
}