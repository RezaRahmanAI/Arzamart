export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
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
  parentId: number | null;
  orderedIds: number[];
}
