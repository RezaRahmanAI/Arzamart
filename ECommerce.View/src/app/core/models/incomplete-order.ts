export interface IncompleteOrderAutosave {
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  city?: string;
  area?: string;
  productId?: number;
  productName?: string;
  selectedSize?: string;
  quantity?: number;
  totalPrice?: number;
  landingPageName?: string;
  landingPageId?: number;
  referrerUrl?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmAdset?: string;
  utmAd?: string;
  fbclid?: string;
  deviceType?: string;
  browser?: string;
}

export interface IncompleteOrderStats {
  todayIncompleteCount: number;
  recoveredCount: number;
  recoveryRate: number;
  topLandingPage: string;
}
