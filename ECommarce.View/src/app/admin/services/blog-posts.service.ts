import { Injectable, inject } from "@angular/core";
import { map } from "rxjs";

import { ApiHttpClient } from "../../core/http/http-client";
import { BlogPost } from "../../features/blog/blog.models";
import { BlogPostPayload } from "../models/blog-posts.models";

@Injectable({
  providedIn: "root",
})
export class BlogPostsService {
  private readonly api = inject(ApiHttpClient);

  getAll() {
    return this.api
      .get<BlogPost[]>("/admin/blog/posts")
      .pipe(map((posts) => posts.map((post) => this.mapPost(post))));
  }

  getById(id: number) {
    return this.api
      .get<BlogPost>(`/admin/blog/posts/${id}`)
      .pipe(map((post) => this.mapPost(post)));
  }

  create(payload: BlogPostPayload) {
    return this.api
      .post<BlogPost>("/admin/blog/posts", payload)
      .pipe(map((post) => this.mapPost(post)));
  }

  update(id: number, payload: BlogPostPayload) {
    return this.api
      .post<BlogPost>(`/admin/blog/posts/${id}`, payload)
      .pipe(map((post) => this.mapPost(post)));
  }

  delete(id: number) {
    return this.api.delete<boolean>(`/admin/blog/posts/${id}`);
  }

  private mapPost(post: BlogPost): BlogPost {
    return {
      ...post,
      publishedAt: new Date(post.publishedAt),
    };
  }
}
