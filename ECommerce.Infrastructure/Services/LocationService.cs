using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs.Location;
using ECommerce.Core.Entities.Location;
using ECommerce.Core.Entities.Shop;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class LocationService : ILocationService
{
    private readonly IUnitOfWork _unitOfWork;

    public LocationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<DivisionDto>> GetDivisionsAsync()
    {
        var divisions = await _unitOfWork.Repository<Division>()
            .GetQueryable()
            .OrderBy(d => d.DisplayOrder)
            .Select(d => new DivisionDto
            {
                Id = d.Id,
                NameEn = d.NameEn,
                NameBn = d.NameBn,
                BdGovtCode = d.BdGovtCode,
                DisplayOrder = d.DisplayOrder,
                IsActive = d.IsActive
            })
            .ToListAsync();

        return divisions;
    }

    public async Task<List<DistrictDto>> GetDistrictsByDivisionIdAsync(int divisionId)
    {
        var districts = await _unitOfWork.Repository<District>()
            .GetQueryable()
            .Where(d => d.DivisionId == divisionId)
            .OrderBy(d => d.DisplayOrder)
            .Select(d => new DistrictDto
            {
                Id = d.Id,
                NameEn = d.NameEn,
                NameBn = d.NameBn,
                BdGovtCode = d.BdGovtCode,
                DisplayOrder = d.DisplayOrder,
                IsActive = d.IsActive,
                DivisionId = d.DivisionId
            })
            .ToListAsync();

        return districts;
    }

    public async Task<List<UpazilaDto>> GetUpazilasByDistrictIdAsync(int districtId)
    {
        var upazilas = await _unitOfWork.Repository<Upazila>()
            .GetQueryable()
            .Where(u => u.DistrictId == districtId)
            .OrderBy(u => u.DisplayOrder)
            .Select(u => new UpazilaDto
            {
                Id = u.Id,
                NameEn = u.NameEn,
                NameBn = u.NameBn,
                BdGovtCode = u.BdGovtCode,
                DisplayOrder = u.DisplayOrder,
                IsActive = u.IsActive,
                DistrictId = u.DistrictId
            })
            .ToListAsync();

        return upazilas;
    }

    public async Task<LocationHierarchyDto> GetAllLocationsAsync()
    {
        var divisions = await _unitOfWork.Repository<Division>()
            .GetQueryable()
            .Include(d => d.Districts.OrderBy(dd => dd.DisplayOrder))
                .ThenInclude(dd => dd.Upazilas.OrderBy(u => u.DisplayOrder))
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync();

        var result = new LocationHierarchyDto
        {
            Divisions = divisions.Select(d => new DivisionHierarchyDto
            {
                Id = d.Id,
                NameEn = d.NameEn,
                NameBn = d.NameBn,
                DisplayOrder = d.DisplayOrder,
                Districts = d.Districts.Select(dd => new DistrictHierarchyDto
                {
                    Id = dd.Id,
                    NameEn = dd.NameEn,
                    NameBn = dd.NameBn,
                    DisplayOrder = dd.DisplayOrder,
                    Upazilas = dd.Upazilas.Select(u => new UpazilaHierarchyDto
                    {
                        Id = u.Id,
                        NameEn = u.NameEn,
                        NameBn = u.NameBn,
                        DisplayOrder = u.DisplayOrder,
                        DistrictId = dd.Id
                    }).ToList()
                }).ToList()
            }).ToList()
        };

        return result;
    }

    public async Task<DivisionDto> CreateDivisionAsync(DivisionDto dto)
    {
        var division = new Division
        {
            NameEn = dto.NameEn,
            NameBn = dto.NameBn,
            BdGovtCode = dto.BdGovtCode,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };

        var repo = _unitOfWork.Repository<Division>();
        repo.Add(division);
        await _unitOfWork.Complete();

        dto.Id = division.Id;
        return dto;
    }

    public async Task<DivisionDto> UpdateDivisionAsync(int id, DivisionDto dto)
    {
        var repo = _unitOfWork.Repository<Division>();
        var division = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Division with id {id} not found");

        division.NameEn = dto.NameEn;
        division.NameBn = dto.NameBn;
        division.BdGovtCode = dto.BdGovtCode;
        division.DisplayOrder = dto.DisplayOrder;
        division.IsActive = dto.IsActive;
        division.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();
        dto.Id = id;
        return dto;
    }

    public async Task DeleteDivisionAsync(int id)
    {
        var repo = _unitOfWork.Repository<Division>();
        var division = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Division with id {id} not found");

        repo.Delete(division);
        await _unitOfWork.Complete();
    }

    public async Task<DistrictDto> CreateDistrictAsync(DistrictDto dto)
    {
        var district = new District
        {
            NameEn = dto.NameEn,
            NameBn = dto.NameBn,
            BdGovtCode = dto.BdGovtCode,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            DivisionId = dto.DivisionId
        };

        var repo = _unitOfWork.Repository<District>();
        repo.Add(district);
        await _unitOfWork.Complete();

        dto.Id = district.Id;
        return dto;
    }

    public async Task<DistrictDto> UpdateDistrictAsync(int id, DistrictDto dto)
    {
        var repo = _unitOfWork.Repository<District>();
        var district = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"District with id {id} not found");

        district.NameEn = dto.NameEn;
        district.NameBn = dto.NameBn;
        district.BdGovtCode = dto.BdGovtCode;
        district.DisplayOrder = dto.DisplayOrder;
        district.IsActive = dto.IsActive;
        district.DivisionId = dto.DivisionId;
        district.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();
        dto.Id = id;
        return dto;
    }

    public async Task DeleteDistrictAsync(int id)
    {
        var repo = _unitOfWork.Repository<District>();
        var district = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"District with id {id} not found");

        repo.Delete(district);
        await _unitOfWork.Complete();
    }

    public async Task<UpazilaDto> CreateUpazilaAsync(UpazilaDto dto)
    {
        var upazila = new Upazila
        {
            NameEn = dto.NameEn,
            NameBn = dto.NameBn,
            BdGovtCode = dto.BdGovtCode,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            DistrictId = dto.DistrictId
        };

        var repo = _unitOfWork.Repository<Upazila>();
        repo.Add(upazila);
        await _unitOfWork.Complete();

        dto.Id = upazila.Id;
        return dto;
    }

    public async Task<UpazilaDto> UpdateUpazilaAsync(int id, UpazilaDto dto)
    {
        var repo = _unitOfWork.Repository<Upazila>();
        var upazila = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Upazila with id {id} not found");

        upazila.NameEn = dto.NameEn;
        upazila.NameBn = dto.NameBn;
        upazila.BdGovtCode = dto.BdGovtCode;
        upazila.DisplayOrder = dto.DisplayOrder;
        upazila.IsActive = dto.IsActive;
        upazila.DistrictId = dto.DistrictId;
        upazila.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();
        dto.Id = id;
        return dto;
    }

    public async Task DeleteUpazilaAsync(int id)
    {
        var repo = _unitOfWork.Repository<Upazila>();
        var upazila = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Upazila with id {id} not found");

        repo.Delete(upazila);
        await _unitOfWork.Complete();
    }

    public async Task<List<DeliveryZoneListDto>> GetDeliveryZonesAsync()
    {
        var zones = await _unitOfWork.Repository<DeliveryZone>()
            .GetQueryable()
            .Include(z => z.DeliveryZoneUpazilas)
            .OrderBy(z => z.DisplayOrder)
            .Select(z => new DeliveryZoneListDto
            {
                Id = z.Id,
                Name = z.Name,
                Description = z.Description,
                DisplayOrder = z.DisplayOrder,
                IsActive = z.IsActive,
                UpazilaCount = z.DeliveryZoneUpazilas.Count
            })
            .ToListAsync();

        return zones;
    }

    public async Task<DeliveryZoneDto> GetDeliveryZoneAsync(int id)
    {
        var zone = await _unitOfWork.Repository<DeliveryZone>()
            .GetQueryable()
            .Include(z => z.DeliveryZoneUpazilas)
            .FirstOrDefaultAsync(z => z.Id == id)
            ?? throw new InvalidOperationException($"Delivery zone with id {id} not found");

        return new DeliveryZoneDto
        {
            Id = zone.Id,
            Name = zone.Name,
            Description = zone.Description,
            DisplayOrder = zone.DisplayOrder,
            IsActive = zone.IsActive,
            UpazilaIds = zone.DeliveryZoneUpazilas.Select(zu => zu.UpazilaId).ToList()
        };
    }

    public async Task<DeliveryZoneDto> CreateDeliveryZoneAsync(DeliveryZoneDto dto)
    {
        var repo = _unitOfWork.Repository<DeliveryZone>();
        var zoneUpazilaRepo = _unitOfWork.Repository<DeliveryZoneUpazila>();

        var zone = new DeliveryZone
        {
            Name = dto.Name,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };

        repo.Add(zone);
        await _unitOfWork.Complete();

        if (dto.UpazilaIds.Any())
        {
            foreach (var upazilaId in dto.UpazilaIds)
            {
                zoneUpazilaRepo.Add(new DeliveryZoneUpazila
                {
                    DeliveryZoneId = zone.Id,
                    UpazilaId = upazilaId
                });
            }
            await _unitOfWork.Complete();
        }

        dto.Id = zone.Id;
        return dto;
    }

    public async Task<DeliveryZoneDto> UpdateDeliveryZoneAsync(int id, DeliveryZoneDto dto)
    {
        var repo = _unitOfWork.Repository<DeliveryZone>();
        var zoneUpazilaRepo = _unitOfWork.Repository<DeliveryZoneUpazila>();

        var zone = await repo.GetQueryable()
            .Include(z => z.DeliveryZoneUpazilas)
            .FirstOrDefaultAsync(z => z.Id == id)
            ?? throw new InvalidOperationException($"Delivery zone with id {id} not found");

        zone.Name = dto.Name;
        zone.Description = dto.Description;
        zone.DisplayOrder = dto.DisplayOrder;
        zone.IsActive = dto.IsActive;
        zone.UpdatedAt = DateTime.UtcNow;

        // Remove existing and re-add
        foreach (var existing in zone.DeliveryZoneUpazilas.ToList())
        {
            zoneUpazilaRepo.Delete(existing);
        }

        foreach (var upazilaId in dto.UpazilaIds)
        {
            zoneUpazilaRepo.Add(new DeliveryZoneUpazila
            {
                DeliveryZoneId = id,
                UpazilaId = upazilaId
            });
        }

        await _unitOfWork.Complete();
        dto.Id = id;
        return dto;
    }

    public async Task<int?> GetDeliveryZoneIdByUpazilaIdAsync(int upazilaId)
    {
        var zoneUpazila = await _unitOfWork.Repository<DeliveryZoneUpazila>()
            .GetQueryable()
            .FirstOrDefaultAsync(zu => zu.UpazilaId == upazilaId);

        return zoneUpazila?.DeliveryZoneId;
    }

    public async Task DeleteDeliveryZoneAsync(int id)
    {
        var repo = _unitOfWork.Repository<DeliveryZone>();
        var zone = await repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Delivery zone with id {id} not found");

        repo.Delete(zone);
        await _unitOfWork.Complete();
    }
}
