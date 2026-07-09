using ECommerce.API.Helpers;
using ECommerce.Core.DTOs.Location;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[Route("api/admin/locations")]
public class AdminLocationsController : ControllerBase
{
    private readonly ILocationService _locationService;

    public AdminLocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    // Divisions
    [HttpGet("divisions")]
    public async Task<ActionResult<List<DivisionDto>>> GetDivisions()
    {
        var divisions = await _locationService.GetDivisionsAsync();
        return Ok(divisions);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("divisions")]
    public async Task<ActionResult<DivisionDto>> CreateDivision([FromBody] DivisionDto dto)
    {
        var result = await _locationService.CreateDivisionAsync(dto);
        return CreatedAtAction(nameof(GetDivisions), new { id = result.Id }, result);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("divisions/{id}")]
    public async Task<ActionResult<DivisionDto>> UpdateDivision(int id, [FromBody] DivisionDto dto)
    {
        try
        {
            var result = await _locationService.UpdateDivisionAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("divisions/{id}/delete")]
    public async Task<IActionResult> DeleteDivision(int id)
    {
        try
        {
            await _locationService.DeleteDivisionAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    // Districts
    [HttpGet("districts")]
    public async Task<ActionResult<List<DistrictDto>>> GetDistricts([FromQuery] int? divisionId)
    {
        if (divisionId.HasValue)
        {
            var districts = await _locationService.GetDistrictsByDivisionIdAsync(divisionId.Value);
            return Ok(districts);
        }

        // Return all if no filter
        var all = await _locationService.GetAllLocationsAsync();
        var allDistricts = all.Divisions.SelectMany(d => d.Districts)
            .Select(d => new DistrictDto
            {
                Id = d.Id,
                NameEn = d.NameEn,
                NameBn = d.NameBn,
                DisplayOrder = d.DisplayOrder,
                IsActive = true,
                DivisionId = all.Divisions.First(dv => dv.Districts.Any(dd => dd.Id == d.Id)).Id
            }).ToList();
        return Ok(allDistricts);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("districts")]
    public async Task<ActionResult<DistrictDto>> CreateDistrict([FromBody] DistrictDto dto)
    {
        var result = await _locationService.CreateDistrictAsync(dto);
        return CreatedAtAction(nameof(GetDistricts), new { id = result.Id }, result);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("districts/{id}")]
    public async Task<ActionResult<DistrictDto>> UpdateDistrict(int id, [FromBody] DistrictDto dto)
    {
        try
        {
            var result = await _locationService.UpdateDistrictAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("districts/{id}/delete")]
    public async Task<IActionResult> DeleteDistrict(int id)
    {
        try
        {
            await _locationService.DeleteDistrictAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    // Upazilas
    [HttpGet("upazilas")]
    public async Task<ActionResult<List<UpazilaDto>>> GetUpazilas([FromQuery] int? districtId)
    {
        if (districtId.HasValue)
        {
            var upazilas = await _locationService.GetUpazilasByDistrictIdAsync(districtId.Value);
            return Ok(upazilas);
        }

        var all = await _locationService.GetAllLocationsAsync();
        var allUpazilas = all.Divisions.SelectMany(d => d.Districts)
            .SelectMany(dd => dd.Upazilas)
            .Select(u => new UpazilaDto
            {
                Id = u.Id,
                NameEn = u.NameEn,
                NameBn = u.NameBn,
                DisplayOrder = u.DisplayOrder,
                IsActive = true,
                DistrictId = u.DistrictId
            }).ToList();
        return Ok(allUpazilas);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("upazilas")]
    public async Task<ActionResult<UpazilaDto>> CreateUpazila([FromBody] UpazilaDto dto)
    {
        var result = await _locationService.CreateUpazilaAsync(dto);
        return CreatedAtAction(nameof(GetUpazilas), new { id = result.Id }, result);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("upazilas/{id}")]
    public async Task<ActionResult<UpazilaDto>> UpdateUpazila(int id, [FromBody] UpazilaDto dto)
    {
        try
        {
            var result = await _locationService.UpdateUpazilaAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("upazilas/{id}/delete")]
    public async Task<IActionResult> DeleteUpazila(int id)
    {
        try
        {
            await _locationService.DeleteUpazilaAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    // Delivery Zones
    [HttpGet("delivery-zones")]
    public async Task<ActionResult<List<DeliveryZoneListDto>>> GetDeliveryZones()
    {
        var zones = await _locationService.GetDeliveryZonesAsync();
        return Ok(zones);
    }

    [HttpGet("delivery-zones/{id}")]
    public async Task<ActionResult<DeliveryZoneDto>> GetDeliveryZone(int id)
    {
        try
        {
            var zone = await _locationService.GetDeliveryZoneAsync(id);
            return Ok(zone);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("delivery-zones")]
    public async Task<ActionResult<DeliveryZoneDto>> CreateDeliveryZone([FromBody] DeliveryZoneDto dto)
    {
        var result = await _locationService.CreateDeliveryZoneAsync(dto);
        return CreatedAtAction(nameof(GetDeliveryZones), new { id = result.Id }, result);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("delivery-zones/{id}")]
    public async Task<ActionResult<DeliveryZoneDto>> UpdateDeliveryZone(int id, [FromBody] DeliveryZoneDto dto)
    {
        try
        {
            var result = await _locationService.UpdateDeliveryZoneAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("delivery-zones/{id}/delete")]
    public async Task<IActionResult> DeleteDeliveryZone(int id)
    {
        try
        {
            await _locationService.DeleteDeliveryZoneAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}
