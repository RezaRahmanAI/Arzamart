export interface DeliveryMethod {
  id: number;
  name: string;
  cost: number;
  estimatedDays?: string;
  isActive: boolean;
}

export interface ShippingZone {
  id: number;
  name: string;
  region: string;
  rates: string[];
}
