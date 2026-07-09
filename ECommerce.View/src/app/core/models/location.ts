export interface DivisionDto {
  id: number;
  nameEn: string;
  nameBn: string;
  bdGovtCode?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface DistrictDto {
  id: number;
  nameEn: string;
  nameBn: string;
  bdGovtCode?: string;
  displayOrder: number;
  isActive: boolean;
  divisionId: number;
}

export interface UpazilaDto {
  id: number;
  nameEn: string;
  nameBn: string;
  bdGovtCode?: string;
  displayOrder: number;
  isActive: boolean;
  districtId: number;
}

export interface LocationHierarchy {
  divisions: DivisionHierarchy[];
}

export interface DivisionHierarchy {
  id: number;
  nameEn: string;
  nameBn: string;
  displayOrder: number;
  districts: DistrictHierarchy[];
}

export interface DistrictHierarchy {
  id: number;
  nameEn: string;
  nameBn: string;
  displayOrder: number;
  upazilas: UpazilaHierarchy[];
}

export interface UpazilaHierarchy {
  id: number;
  nameEn: string;
  nameBn: string;
  displayOrder: number;
  districtId: number;
}

export interface DeliveryZoneListDto {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  upazilaCount: number;
}

export interface DeliveryZoneDto {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  upazilaIds: number[];
}