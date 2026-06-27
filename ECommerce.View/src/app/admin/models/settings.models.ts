export { DeliveryMethod, ShippingZone } from "../../core/models/delivery";

import { DeliveryMethod, ShippingZone } from "../../core/models/delivery";

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
  sizeGuideImageUrl?: string;
  // Deprecated/Legacy fields mapped if necessary or removed
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
  stripePublishableKey?: string;
  description?: string;
  facebookPixelId?: string;
  googleTagId?: string;
}
