export interface DeliveryMethod {
  id: number;
  name: string;
  cost: number;
  estimatedDays?: string;
  isActive: boolean;
  deliveryZoneId?: number;
}

export interface ShippingZone {
  id: number;
  name: string;
  region: string;
  rates: string[];
}
