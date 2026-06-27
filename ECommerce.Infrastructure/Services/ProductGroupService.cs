using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Helpers;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Specifications;

namespace ECommerce.Infrastructure.Services;

public class ProductGroupService : IProductGroupService
{
    private readonly IGenericRepository<ProductGroup> _groupsRepo;
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppCache _cache;

    public ProductGroupService(
        IGenericRepository<ProductGroup> groupsRepo,
        IGenericRepository<Product> productsRepo,
        IUnitOfWork unitOfWork,
        AppCache cache)
    {
        _groupsRepo = groupsRepo;
        _productsRepo = productsRepo;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    private Task InvalidateCacheAsync()
    {
        lock (_cache.RebuildLock)
        {
            HomePageCacheRebuilder.Rebuild(_cache);
        }
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<ProductGroup>> GetAllAsync()
    {
        return await _groupsRepo.ListAllAsync();
    }

    public async Task<ProductGroup?> GetByIdAsync(int id)
    {
        var spec = new BaseSpecification<ProductGroup>(x => x.Id == id);
        spec.AddInclude(x => x.Products);
        return await _groupsRepo.GetEntityWithSpec(spec);
    }

    public async Task<ProductGroup> CreateAsync(ProductGroup group)
    {
        _groupsRepo.Add(group);
        await _unitOfWork.Complete();
        await InvalidateCacheAsync();
        return group;
    }

    public async Task UpdateAsync(int id, ProductGroup group)
    {
        if (id != group.Id)
            throw new InvalidOperationException("ID mismatch");

        _groupsRepo.Update(group);
        await _unitOfWork.Complete();
        await InvalidateCacheAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var group = await _groupsRepo.GetByIdAsync(id);
        if (group == null)
            throw new InvalidOperationException($"ProductGroup with ID {id} not found");

        _groupsRepo.Delete(group);
        await _unitOfWork.Complete();
        await InvalidateCacheAsync();
    }

    public async Task AddProductToGroupAsync(int groupId, int productId)
    {
        var group = await _groupsRepo.GetByIdAsync(groupId);
        if (group == null)
            throw new InvalidOperationException($"ProductGroup with ID {groupId} not found");

        var product = await _productsRepo.GetByIdAsync(productId);
        if (product == null)
            throw new InvalidOperationException($"Product with ID {productId} not found");

        product.ProductGroupId = groupId;
        _productsRepo.Update(product);
        await _unitOfWork.Complete();

        if (_cache.Products.TryGetValue(productId, out var cachedProduct))
        {
            cachedProduct.ProductGroupId = groupId;
        }

        await InvalidateCacheAsync();
    }

    public async Task RemoveProductFromGroupAsync(int groupId, int productId)
    {
        var product = await _productsRepo.GetByIdAsync(productId);
        if (product == null)
            throw new InvalidOperationException($"Product with ID {productId} not found");

        if (product.ProductGroupId == groupId)
        {
            product.ProductGroupId = null;
            _productsRepo.Update(product);
            await _unitOfWork.Complete();

            if (_cache.Products.TryGetValue(productId, out var cachedProduct))
            {
                cachedProduct.ProductGroupId = null;
            }

            await InvalidateCacheAsync();
        }
    }
}
