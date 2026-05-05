using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/product-groups")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminProductGroupsController : ControllerBase
{
    private readonly IGenericRepository<ProductGroup> _groupsRepo;
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AdminProductGroupsController(
        IGenericRepository<ProductGroup> groupsRepo,
        IGenericRepository<Product> productsRepo,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _groupsRepo = groupsRepo;
        _productsRepo = productsRepo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductGroup>>> GetGroups()
    {
        return Ok(await _groupsRepo.ListAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductGroup>> GetGroup(int id)
    {
        var spec = new BaseSpecification<ProductGroup>(x => x.Id == id);
        spec.AddInclude(x => x.Products);
        var group = await _groupsRepo.GetEntityWithSpec(spec);

        if (group == null) return NotFound();

        return Ok(group);
    }

    [HttpPost]
    public async Task<ActionResult<ProductGroup>> CreateGroup(ProductGroup group)
    {
        _groupsRepo.Add(group);
        await _unitOfWork.Complete();
        return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateGroup(int id, ProductGroup group)
    {
        if (id != group.Id) return BadRequest();

        _groupsRepo.Update(group);
        await _unitOfWork.Complete();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteGroup(int id)
    {
        var group = await _groupsRepo.GetByIdAsync(id);
        if (group == null) return NotFound();

        // Products' ProductGroupId will be set to NULL by EF (configured in DbContext)
        _groupsRepo.Delete(group);
        await _unitOfWork.Complete();
        return NoContent();
    }

    [HttpPost("{groupId}/products/{productId}")]
    public async Task<ActionResult> AddProductToGroup(int groupId, int productId)
    {
        var group = await _groupsRepo.GetByIdAsync(groupId);
        if (group == null) return NotFound("Group not found");

        var product = await _productsRepo.GetByIdAsync(productId);
        if (product == null) return NotFound("Product not found");

        product.ProductGroupId = groupId;
        _productsRepo.Update(product);
        await _unitOfWork.Complete();

        return NoContent();
    }

    [HttpDelete("{groupId}/products/{productId}")]
    public async Task<ActionResult> RemoveProductFromGroup(int groupId, int productId)
    {
        var product = await _productsRepo.GetByIdAsync(productId);
        if (product == null) return NotFound("Product not found");

        if (product.ProductGroupId == groupId)
        {
            product.ProductGroupId = null;
            _productsRepo.Update(product);
            await _unitOfWork.Complete();
        }

        return NoContent();
    }
}
