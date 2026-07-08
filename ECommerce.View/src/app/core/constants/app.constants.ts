/**
 * Application-wide constants for the frontend
 * These should match the backend constants where applicable
 */

export const AppConstants = {
  /** Base number for order number generation (OrderNumber = OrderId + OrderNumberBase) */
  OrderNumberBase: 16000,

  /** Maximum request body size in bytes (100 MB) */
  MaxRequestBodySize: 104_857_600,

  /** Default session expiry in days for guest carts */
  GuestSessionExpiryDays: 7,

  /** JWT token clock skew tolerance in minutes */
  JwtClockSkewMinutes: 5,
} as const;

export const CacheDurations = {
  /** 30 minutes - Product Reviews */
  Review: 30 * 60 * 1000,

  /** 5 minutes - Short cache */
  Short: 5 * 60 * 1000,

  /** 10 minutes - Medium cache */
  Medium: 10 * 60 * 1000,

  /** 30 minutes - Long cache */
  Long: 30 * 60 * 1000,

  /** 60 minutes - Extended cache */
  Extended: 60 * 60 * 1000,

  /** 6 hours - Homepage, Featured, Trending, Popular */
  HalfDay: 6 * 60 * 60 * 1000,

  /** 12 hours - Banners */
  TwelveHours: 12 * 60 * 60 * 1000,

  /** 24 hours - Product Details, Search Suggestions */
  OneDay: 24 * 60 * 60 * 1000,

  /** 30 days - Navigation, Categories, Site Settings, Footer, Static Pages */
  ThirtyDays: 30 * 24 * 60 * 60 * 1000,
} as const;

export const RateLimits = {
  /** Fixed window limiter: requests per window */
  FixedWindowPermitLimit: 100,

  /** Fixed window limiter: window duration in ms */
  FixedWindowDuration: 60 * 1000,

  /** Fixed window limiter: queue limit */
  FixedWindowQueueLimit: 20,

  /** Sliding window limiter: requests per window */
  SlidingWindowPermitLimit: 50,

  /** Sliding window limiter: window duration in ms */
  SlidingWindowDuration: 10 * 1000,

  /** Sliding window limiter: segments per window */
  SlidingWindowSegments: 5,

  /** Sliding window limiter: queue limit */
  SlidingWindowQueueLimit: 10,
} as const;

export const FileUpload = {
  /** Maximum file upload size in bytes (100 MB) */
  MaxFileSize: 104_857_600,

  /** Products upload folder name */
  ProductsFolder: 'products',

  /** Banners upload folder name */
  BannersFolder: 'banners',

  /** Categories upload folder name */
  CategoriesFolder: 'categories',
} as const;

export const ClaimTypes = {
  IsSuperAdmin: 'is_super_admin',
  AllowedMenus: 'allowed_menus',
} as const;