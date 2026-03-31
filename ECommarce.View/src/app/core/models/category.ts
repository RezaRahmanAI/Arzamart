export interface Category {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  href?: string;
  displayOrder?: number;
  isActive?: boolean;
  productCount?: number;
  subCategories?: Category[];
}
