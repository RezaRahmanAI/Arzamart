using System;
using System.Threading.Tasks;

namespace ECommerce.Core.Interfaces;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task RemoveByPrefixAsync(string prefix);
    
    /// <summary>
    /// Cache Aside implementation: 
    /// Try to get from cache, if missing -> factory() -> Cache results -> return.
    /// </summary>
    Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null);
}
