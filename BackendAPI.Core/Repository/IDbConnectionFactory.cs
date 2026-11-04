using System.Data;

namespace BackendAPI.Core.Repository;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}