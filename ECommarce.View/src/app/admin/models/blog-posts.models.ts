import { BlogCategory, BlogContentBlock } from '../../features/blog/blog.models';

export interface BlogPostPayload {
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
  publishedAt: string | Date;
  readTime: string;
  tags: string[];
  featured: boolean;
  coverImageCaption?: string;
}
