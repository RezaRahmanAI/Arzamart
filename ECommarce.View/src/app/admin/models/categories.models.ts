export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  sortOrder: number;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
  displayOrder?: number;
  collections?: Collection[];
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  subCategoryId: number;
  isActive: boolean;
}

export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

export interface ReorderPayload {
  parentId: string | null;
  orderedIds: string[];
}
