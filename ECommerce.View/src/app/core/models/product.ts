export interface ProductImage {
  id: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  sku?: string;
  size?: string;
  price?: number;
  compareAtPrice?: number;
  purchaseRate?: number;
  stockQuantity: number;
  isDefault?: boolean;
}

export enum ProductType {
  Simple = 0,
  Combo = 1,
}

export interface ComboItem {
  productId: number;
  productVariantId?: number;
  quantity: number;
  productName?: string;
  variantName?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  purchaseRate?: number;
  stockQuantity: number;
  isActive: boolean;
  isNew: boolean;
  isFeatured: boolean;

  categoryId: number;
  categoryName: string;
  subCategoryId?: number;
  subCategoryName?: string;
  collectionId?: number;
  collectionName?: string;

  imageUrl?: string;
  images: ProductImage[];
  variants: ProductVariant[];

  metaTitle?: string;
  metaDescription?: string;
  fabricAndCare?: string;
  shippingAndReturns?: string;
  sizeChartUrl?: string;

  // ilyn.global Design Fields
  tier?: string;
  tags?: string;
  sortOrder?: number;
  bundleSize?: number;
  productType: ProductType;
  comboItems?: ComboItem[];
  productGroupId?: number;
}

export interface RelatedProduct {
  id: number;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  slug: string;
  tier?: string;
  variants?: ProductVariant[];
}

export interface AdminProduct extends Product {
  status?: ProductStatus;
  statusActive?: boolean;
  category?: string;
}

export type ProductStatus = "Active" | "Draft" | "Archived" | "Out of Stock";

export type ProductsStatusTab = "All Items" | "Active" | "Drafts" | "Archived";

export interface ProductPayload {
  name: string;
  description: string;
  shortDescription?: string;
  category: string;
  gender: string;
  price: number;
  salePrice?: number;
  purchaseRate: number;

  newArrival: boolean;
  isFeatured: boolean;

  statusActive: boolean;

  media: {
    mainImage: {
      type: string;
      label: string;
      imageUrl: string;
      alt: string;
    };
    thumbnails: {
      type: string;
      label: string;
      imageUrl: string;
      alt: string;
    }[];
  };

  variants: {
    sizes: {
      label: string;
      price: number;
      salePrice?: number;
      purchaseRate: number;
      stock: number;
      selected: boolean;
    }[];
  };

  inventoryVariants: {
    label: string;
    price: number;
    salePrice?: number;
    purchaseRate: number;
    sku: string;
    inventory: number;
    imageUrl?: string;
  }[];

  meta: {
    fabricAndCare: string;
    shippingAndReturns: string;
    sizeChartUrl?: string;
  };

  ratings?: {
    average: number;
    count: number;
  };

  tier?: string;
  tags?: string;
  sortOrder?: number;
  subCategoryId?: number | null;
  collectionId?: number | null;
  productType: ProductType;
  bundleSize: number;
  comboItems?: ComboItem[];
  productGroupId?: number | null;
}

/** @deprecated Use ProductPayload */
export type ProductCreatePayload = ProductPayload;
/** @deprecated Use ProductPayload */
export type ProductUpdatePayload = ProductPayload;

export interface ProductsQueryParams {
  searchTerm: string;
  category: string;
  statusTab: string;
  stockStatus?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  page: number;
  pageSize: number;
}
