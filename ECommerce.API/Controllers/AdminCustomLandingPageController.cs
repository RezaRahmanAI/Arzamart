using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin")]
[ApiController]
[Route("api/admin/custom-landing-page")]
public class AdminCustomLandingPageController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public AdminCustomLandingPageController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("{productId}")]
    public async Task<ActionResult<CustomLandingPageConfigDto>> GetConfig(int productId)
    {
        var config = await _context.CustomLandingPageConfigs
            .FirstOrDefaultAsync(c => c.ProductId == productId);

        if (config == null)
        {
            // Return empty config with just ProductId if not found
            return Ok(new CustomLandingPageConfigDto { ProductId = productId });
        }

        return Ok(_mapper.Map<CustomLandingPageConfigDto>(config));
    }

    [HttpPost]
    public async Task<ActionResult<CustomLandingPageConfigDto>> SaveConfig(CustomLandingPageConfigUpdateDto updateDto)
    {
        var config = await _context.CustomLandingPageConfigs
            .FirstOrDefaultAsync(c => c.ProductId == updateDto.ProductId);

        if (config == null)
        {
            config = _mapper.Map<CustomLandingPageConfig>(updateDto);
            _context.CustomLandingPageConfigs.Add(config);
        }
        else
        {
            _mapper.Map(updateDto, config);
        }

        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<CustomLandingPageConfigDto>(config));
    }
}
