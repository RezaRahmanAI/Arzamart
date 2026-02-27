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

export interface AdminSettings {
  websiteName: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  currency?: string;
  freeShippingThreshold?: number;
  shippingCharge?: number;
  deliveryMethods: DeliveryMethod[];
  shippingZones: ShippingZone[];
  // Deprecated/Legacy fields mapped if necessary or removed
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
  stripePublishableKey?: string;
  description?: string;
  facebookPixelId?: string;
  googleTagId?: string;
}
