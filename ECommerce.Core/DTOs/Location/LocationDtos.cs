namespace ECommerce.Core.DTOs.Location;

public class DivisionDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string? BdGovtCode { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class DistrictDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string? BdGovtCode { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int DivisionId { get; set; }
}

public class UpazilaDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string? BdGovtCode { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int DistrictId { get; set; }
}

public class LocationHierarchyDto
{
    public List<DivisionHierarchyDto> Divisions { get; set; } = new();
}

public class DivisionHierarchyDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public List<DistrictHierarchyDto> Districts { get; set; } = new();
}

public class DistrictHierarchyDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public List<UpazilaHierarchyDto> Upazilas { get; set; } = new();
}

public class UpazilaHierarchyDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int DistrictId { get; set; }
}
