namespace BackendAPI.Core.Repository;

public interface IInterviewStatusRepository
{
    Task<int?> GetIdByNameAsync(string statusName);
    Task<Dictionary<int, string>> GetAllAsDictionaryAsync();
}