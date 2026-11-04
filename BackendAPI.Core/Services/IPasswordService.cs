using System.Threading.Tasks;

namespace BackendAPI.Core.Services;

public interface IPasswordService
{
    // Emails a verification code to the person's own address.
    Task SendCodeAsync(int userId);

    // Checks the code, then saves the new password. Throws InvalidOperationException with a message the person can read.
    Task ChangeAsync(int userId, string otpCode, string newPassword);
}
