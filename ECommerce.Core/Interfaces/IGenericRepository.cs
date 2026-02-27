using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IGenericRepository<T> where T : BaseEntity
{
    Task<T> GetByIdAsync(int id);
    Task<IReadOnlyList<T>> ListAllAsync();
    Task<T> GetEntityWithSpec(ISpecification<T> spec);
    Task<IReadOnlyList<T>> ListAsync(ISpecification<T> spec);
    Task<int> CountAsync(ISpecification<T> spec);
    
    IQueryable<T> GetQueryable();
    void Add(T entity);
    void Update(T entity);
    void Delete(T entity);
}
