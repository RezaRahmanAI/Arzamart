export interface CustomLandingPageConfig {
  id?: number;
  productId: number;
  relativeTimerTotalMinutes?: number | null;
  isTimerVisible: boolean;
  headerTitle?: string;
  isProductDetailsVisible?: boolean;
  productDetailsTitle?: string;
  isFabricVisible?: boolean;
  isDesignVisible?: boolean;
  isTrustBannerVisible: boolean;
  trustBannerText?: string;
  featuredProductName?: string;
  promoPrice?: number;
  originalPrice?: number;
  promoText?: string;
  freeShippingThresholdQuantity?: number | null;
  isMarqueeVisible?: boolean;
  marqueeText?: string;
  isReviewsVisible?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  productHeroTitle?: string;
  productHeroDescription?: string;
  discountCtaTitle?: string;
  discountCtaDescription?: string;
  infoBannerTitle?: string;
  infoBannerDescription?: string;
  sectionsJson?: string;
}

export interface LandingPageData {
  product: any;
  config: CustomLandingPageConfig | null;
  relatedProducts?: any[];
}

// ─── Dynamic Section System ───────────────────────────────────────────

export interface LandingSection {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  icon?: string;
  settings?: any;
  customFields?: CustomField[];
}

export type CustomFieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'images' | 'button';

export interface CustomField {
  key: string;
  label: string;
  type: CustomFieldType;
  value: any;
  enabled: boolean;
}

// ─── Pre-Order Config ────────────────────────────────────────────────

export interface PreOrderProductConfig {
  enabled: boolean;
  allowedSizes: string[];
}

export type PreOrderConfig = Record<number, PreOrderProductConfig>;

// ─── Layout Types ────────────────────────────────────────────────────

export type LayoutType = 'A' | 'B' | 'C' | 'D' | 'E';

export interface LayoutTypeConfig {
  type: LayoutType;
  name: string;
  description: string;
  icon: string;
  defaultFields: Omit<CustomField, 'value'>[];
}
