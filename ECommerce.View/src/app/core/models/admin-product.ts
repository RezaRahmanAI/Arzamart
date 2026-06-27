import { Product, ProductType, ComboItem } from "./product";

export interface AdminProduct extends Product {
  status?: ProductStatus;
  statusActive?: boolean;
  category?: string;
  subCategory?: string;
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

export interface ProductsQueryParams {
  searchTerm: string;
  category: string;
  subCategory: string;
  statusTab: string;
  stockStatus?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  page: number;
  pageSize: number;
}
