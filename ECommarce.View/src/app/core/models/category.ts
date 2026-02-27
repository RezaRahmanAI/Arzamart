export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl: string;
  href?: string;
  productCount?: number;
  subCategories?: Category[];
}
