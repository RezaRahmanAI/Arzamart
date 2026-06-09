export interface ProductVariantEdit {
  id?: number;
  sku?: string;
  size?: string;
  price?: number;
  salePrice?: number;
  purchaseRate?: number;
  stockQuantity: number;
}

export interface ProductVariantOption {
  optionName: "Size" | "Material" | string;
  values: string;
}

export interface ProductVariantRow {
  label: string;
  price: number;
  sku: string;
  quantity: number;
}
