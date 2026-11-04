using BackendAPI.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Core.Services;

public interface IUserService
{
    Task<IEnumerable<UserResponse>> GetUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(int id);
    Task<UserResponse> CreateUserAsync(UserCreateRequest request);
    Task<bool> UpdateUserAsync(int id, UserUpdateRequest request);
    Task<bool> DeleteUserAsync(int id);

    Task<ProfileResponse?> GetProfileAsync(int userId);
    Task<bool> UpdateProfileAsync(int userId, ProfileUpdateRequest request);

    // Self-service account deletion. Confirmed via an emailed OTP code
    // (same OTP system used for login/registration) instead of a
    // password — this works for every account, including Google
    // accounts that never had a password the user actually knows.
    Task<bool> DeleteOwnAccountAsync(int userId, string otpCode);
}