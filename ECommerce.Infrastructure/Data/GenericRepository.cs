using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Data;

public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    private readonly ApplicationDbContext _context;
    private readonly IConfigurationProvider _mapperConfig;

    public GenericRepository(ApplicationDbContext context, IConfigurationProvider mapperConfig)
    {
        _context = context;
        _mapperConfig = mapperConfig;
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        return await _context.Set<T>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<IReadOnlyList<T>> ListAllAsync()
    {
        return await _context.Set<T>().AsNoTracking().ToListAsync();
    }

    public async Task<T?> GetEntityWithSpec(ISpecification<T> spec, bool track = false)
    {
        var query = ApplySpecification(spec);
        if (!track) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync();
    }

    public async Task<T?> GetEntityWithSpecIgnoreFiltersAsync(ISpecification<T> spec, bool track = false)
    {
        var query = ApplySpecification(spec, ignoreFilters: true);
        if (!track) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync();
    }

    public async Task<TResult?> GetEntityWithSpec<TResult>(ISpecification<T> spec)
    {
        return await ApplySpecification(spec)
            .AsNoTracking()
            .ProjectTo<TResult>(_mapperConfig)
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<T>> ListAsync(ISpecification<T> spec, bool track = false)
    {
        var query = ApplySpecification(spec);
        if (!track) query = query.AsNoTracking();
        return await query.ToListAsync();
    }

    public async Task<IReadOnlyList<TResult>> ListAsync<TResult>(ISpecification<T> spec)
    {
        return await ApplySpecification(spec)
            .AsNoTracking()
            .ProjectTo<TResult>(_mapperConfig)
            .ToListAsync();
    }

    public async Task<int> CountAsync(ISpecification<T> spec)
    {
        return await ApplySpecification(spec, evaluateIncludes: false).AsNoTracking().CountAsync();
    }

    public IQueryable<T> GetQueryable(bool track = false)
    {
        var query = _context.Set<T>().AsQueryable();
        return track ? query : query.AsNoTracking();
    }
    
    public IQueryable<T> GetQueryWithSpec(ISpecification<T> spec)
    {
        return ApplySpecification(spec);
    }

    public void Add(T entity)
    {
        _context.Set<T>().Add(entity);
    }

    public void Update(T entity)
    {
        var entry = _context.Entry(entity);
        if (entry.State == EntityState.Detached)
        {
            _context.Set<T>().Attach(entity);
        }
        entry.State = EntityState.Modified;
    }

    public void Delete(T entity)
    {
        _context.Set<T>().Remove(entity);
    }

    private IQueryable<T> ApplySpecification(ISpecification<T> spec, bool evaluateIncludes = true, bool ignoreFilters = false)
    {
        var query = _context.Set<T>().AsQueryable();
        if (ignoreFilters) query = query.IgnoreQueryFilters();
        return SpecificationEvaluator<T>.GetQuery(query, spec, evaluateIncludes);
    }
}
