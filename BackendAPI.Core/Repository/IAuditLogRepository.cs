using BackendAPI.Core.Models;

namespace BackendAPI.Core.Repository;

public interface IAuditLogRepository
{
    Task<List<AuditLog>> GetByRecordIdAsync(string tableName, int recordId);
}