import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { ApiHttpClient } from '../../core/http/http-client';
import { BlogPost, BlogPostQuery, BlogPostResult } from './blog.models';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly api = inject(ApiHttpClient);

  getFeaturedPost() {
    return this.api.get<BlogPost>('/blog/posts/featured').pipe(
      map((post) => (post ? this.mapPost(post) : undefined)),
      catchError(() => of(undefined))
    );
  }

  getPosts({ category, search, page = 1, pageSize = 6 }: BlogPostQuery) {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));

    if (category) {
      params = params.set('category', category);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.api.get<BlogPostResult>('/blog/posts', { params }).pipe(
      map((result) => ({
        ...result,
        posts: result.posts.map((post) => this.mapPost(post)),
      }))
    );
  }

  getPostBySlug(slug: string) {
    return this.api.get<BlogPost>(`/blog/posts/${slug}`).pipe(
      map((post) => this.mapPost(post)),
      catchError(() => of(undefined))
    );
  }

  getRelatedPosts(slug: string, limit = 3) {
    const params = new HttpParams().set('limit', String(limit));
    return this.api.get<BlogPost[]>(`/blog/posts/${slug}/related`, { params }).pipe(
      map((posts) => posts.map((post) => this.mapPost(post))),
      catchError(() => of([]))
    );
  }

  private mapPost(post: BlogPost): BlogPost {
    return {
      ...post,
      publishedAt: new Date(post.publishedAt),
    };
  }
}
