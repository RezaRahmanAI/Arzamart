export type CacheStore =
  | 'navigation'
  | 'categories'
  | 'subcategories'
  | 'homepage'
  | 'featuredProducts'
  | 'trendingProducts'
  | 'popularProducts'
  | 'siteSettings'
  | 'banners'
  | 'staticPages'
  | 'landingPages'
  | 'productDetails'
  | 'productReviews'
  | 'locations';

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  version: string | null;
  etag: string | null;
  cachedAt: number;
  expiresAt: number;
}

export const CACHE_TTL: Record<CacheStore, number> = {
  navigation: 30 * 24 * 60 * 60 * 1000,
  categories: 30 * 24 * 60 * 60 * 1000,
  subcategories: 30 * 24 * 60 * 60 * 1000,
  homepage: 6 * 60 * 60 * 1000,
  featuredProducts: 6 * 60 * 60 * 1000,
  trendingProducts: 6 * 60 * 60 * 1000,
  popularProducts: 6 * 60 * 60 * 1000,
  siteSettings: 30 * 24 * 60 * 60 * 1000,
  banners: 12 * 60 * 60 * 1000,
  staticPages: 30 * 24 * 60 * 60 * 1000,
  landingPages: 30 * 24 * 60 * 60 * 1000,
  productDetails: 24 * 60 * 60 * 1000,
  productReviews: 30 * 60 * 1000,
  locations: 30 * 24 * 60 * 60 * 1000,
};

export const DB_NAME = 'arzamart_cache';
export const DB_VERSION = 2;
export const METADATA_KEY_PREFIX = 'arza_cache_';
export const CACHE_STORES: CacheStore[] = [
  'navigation',
  'categories',
  'subcategories',
  'homepage',
  'featuredProducts',
  'trendingProducts',
  'popularProducts',
  'siteSettings',
  'banners',
  'staticPages',
  'landingPages',
  'productDetails',
  'productReviews',
  'locations',
];
