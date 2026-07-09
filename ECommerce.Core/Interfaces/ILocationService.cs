using ECommerce.Core.DTOs.Location;

namespace ECommerce.Core.Interfaces;

public interface ILocationService
{
    Task<List<DivisionDto>> GetDivisionsAsync();
    Task<List<DistrictDto>> GetDistrictsByDivisionIdAsync(int divisionId);
    Task<List<UpazilaDto>> GetUpazilasByDistrictIdAsync(int districtId);
    Task<LocationHierarchyDto> GetAllLocationsAsync();
    Task<DivisionDto> CreateDivisionAsync(DivisionDto dto);
    Task<DivisionDto> UpdateDivisionAsync(int id, DivisionDto dto);
    Task DeleteDivisionAsync(int id);
    Task<DistrictDto> CreateDistrictAsync(DistrictDto dto);
    Task<DistrictDto> UpdateDistrictAsync(int id, DistrictDto dto);
    Task DeleteDistrictAsync(int id);
    Task<UpazilaDto> CreateUpazilaAsync(UpazilaDto dto);
    Task<UpazilaDto> UpdateUpazilaAsync(int id, UpazilaDto dto);
    Task DeleteUpazilaAsync(int id);
    Task<List<DeliveryZoneListDto>> GetDeliveryZonesAsync();
    Task<DeliveryZoneDto> GetDeliveryZoneAsync(int id);
    Task<DeliveryZoneDto> CreateDeliveryZoneAsync(DeliveryZoneDto dto);
    Task<DeliveryZoneDto> UpdateDeliveryZoneAsync(int id, DeliveryZoneDto dto);
    Task DeleteDeliveryZoneAsync(int id);
    Task<int?> GetDeliveryZoneIdByUpazilaIdAsync(int upazilaId);
}
