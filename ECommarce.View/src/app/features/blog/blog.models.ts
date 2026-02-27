export type BlogCategory =
  | 'Style Guide'
  | 'Faith'
  | 'Lifestyle'
  | 'Trends'
  | 'Beauty'
  | 'Sustainability'
  | 'Collections'
  | 'Tutorial';

export type BlogContentBlock =
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'heading';
      text: string;
    }
  | {
      type: 'blockquote';
      text: string;
    }
  | {
      type: 'product';
      productId: number;
      productName: string;
      productDescription: string;
      productImage: string;
      productImageAlt: string;
    };

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml?: string;
  content?: BlogContentBlock[];
  coverImage: string;
  category: BlogCategory;
  authorName: string;
  authorAvatar: string;
  authorBio?: string;
  publishedAt: Date;
  readTime: string;
  tags: string[];
  featured: boolean;
  coverImageCaption?: string;
}

export interface BlogPostQuery {
  category?: BlogCategory | 'All';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BlogPostResult {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}
