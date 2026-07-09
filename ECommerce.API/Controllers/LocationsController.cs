using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Location;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

public class LocationsController : BaseApiController
{
    private readonly ILocationService _locationService;

    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    [HttpGet("divisions")]
    public async Task<ActionResult<List<DivisionDto>>> GetDivisions()
    {
        var divisions = await _locationService.GetDivisionsAsync();
        return Ok(divisions);
    }

    [HttpGet("divisions/{divisionId}/districts")]
    public async Task<ActionResult<List<DistrictDto>>> GetDistricts(int divisionId)
    {
        var districts = await _locationService.GetDistrictsByDivisionIdAsync(divisionId);
        return Ok(districts);
    }

    [HttpGet("districts/{districtId}/upazilas")]
    public async Task<ActionResult<List<UpazilaDto>>> GetUpazilas(int districtId)
    {
        var upazilas = await _locationService.GetUpazilasByDistrictIdAsync(districtId);
        return Ok(upazilas);
    }

    [HttpGet("upazilas/{upazilaId}/zone")]
    public async Task<ActionResult<int?>> GetDeliveryZoneByUpazila(int upazilaId)
    {
        var zoneId = await _locationService.GetDeliveryZoneIdByUpazilaIdAsync(upazilaId);
        return Ok(zoneId);
    }

    [HttpGet("all")]
    public async Task<ActionResult<LocationHierarchyDto>> GetAllLocations()
    {
        var hierarchy = await _locationService.GetAllLocationsAsync();
        return Ok(hierarchy);
    }
}
