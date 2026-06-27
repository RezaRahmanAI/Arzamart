export interface CustomLandingPageConfig {
  id?: number;
  productId: number;
  relativeTimerTotalMinutes?: number | null;
  isTimerVisible: boolean;
  headerTitle?: string;
  isProductDetailsVisible: boolean;
  productDetailsTitle?: string;
  isFabricVisible: boolean;
  isDesignVisible: boolean;
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
