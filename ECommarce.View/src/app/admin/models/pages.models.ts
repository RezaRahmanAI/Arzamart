export interface AdminPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
}

export interface PageCreatePayload {
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
}
