using System;
using System.Collections;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;

namespace ECommerce.Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly IConfigurationProvider _mapperConfig;
    private Hashtable _repositories;

    public UnitOfWork(ApplicationDbContext context, IConfigurationProvider mapperConfig)
    {
        _context = context;
        _mapperConfig = mapperConfig;
    }

    public async Task<int> Complete()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity
    {
        if (_repositories == null) _repositories = new Hashtable();

        var type = typeof(TEntity).Name;

        if (!_repositories.ContainsKey(type))
        {
            var repositoryType = typeof(GenericRepository<>);
            var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(TEntity)), _context, _mapperConfig);

            _repositories.Add(type, repositoryInstance);
        }

        return (IGenericRepository<TEntity>)_repositories[type];
    }
}
