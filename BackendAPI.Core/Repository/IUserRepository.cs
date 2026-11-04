using BackendAPI.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Core.Repository;

public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllAsync();
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);   // ← ye naya add kiya
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(User user);
}