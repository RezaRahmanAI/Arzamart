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

    public IQueryable<T> GetQueryable()
    {
        return _context.Set<T>().AsNoTracking().AsQueryable();
    }

    public void Add(T entity)
    {
        _context.Set<T>().Add(entity);
    }

    public void Update(T entity)
    {
        _context.Set<T>().Attach(entity);
        _context.Entry(entity).State = EntityState.Modified;
    }

    public void Delete(T entity)
    {
        _context.Set<T>().Remove(entity);
    }

    private IQueryable<T> ApplySpecification(ISpecification<T> spec, bool evaluateIncludes = true)
    {
        return SpecificationEvaluator<T>.GetQuery(_context.Set<T>().AsQueryable(), spec, evaluateIncludes);
    }
}
