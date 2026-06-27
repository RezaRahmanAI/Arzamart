using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IUnitOfWork : IDisposable, IAsyncDisposable
{
    IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity;
    Task<int> Complete();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
    Task ExecuteInTransactionAsync(Func<Task> action);
}
