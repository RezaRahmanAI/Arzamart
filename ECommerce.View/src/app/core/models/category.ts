export interface Category {
  id: string;
  name: string;
  slug: string;
  href?: string;
  parentId?: string | null;
  imageUrl?: string;
  isActive: boolean;
  productCount?: number;
  displayOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  subCategories?: Category[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder?: number;
  collections?: Collection[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  subCategoryId: string;
  isActive: boolean;
}

export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

export interface ReorderPayload {
  parentId: number | null;
  orderedIds: number[];
}