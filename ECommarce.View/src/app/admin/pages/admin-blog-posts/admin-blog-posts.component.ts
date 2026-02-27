import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { BlogPost } from '../../../features/blog/blog.models';
import { BlogPostPayload } from '../../models/blog-posts.models';
import { BlogPostsService } from '../../services/blog-posts.service';

@Component({
  selector: 'app-admin-blog-posts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-blog-posts.component.html',
})
export class AdminBlogPostsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly blogPostsService = inject(BlogPostsService);

  posts: BlogPost[] = [];
  editingPost?: BlogPost;
  formError = '';

  readonly categories: BlogPost['category'][] = [
    'Style Guide',
    'Faith',
    'Lifestyle',
    'Trends',
    'Beauty',
    'Sustainability',
    'Collections',
    'Tutorial',
  ];

  form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.minLength(3)]],
    excerpt: ['', [Validators.required, Validators.minLength(10)]],
    coverImage: ['', [Validators.required]],
    coverImageCaption: [''],
    category: ['Style Guide' as BlogPost['category'], [Validators.required]],
    authorName: ['', [Validators.required]],
    authorAvatar: ['', [Validators.required]],
    authorBio: [''],
    publishedAt: ['', [Validators.required]],
    readTime: ['', [Validators.required]],
    tags: [''],
    featured: [false],
    contentJson: ['[]'],
  });

  ngOnInit(): void {
    this.loadPosts();
    this.startNew();
  }

  startNew(): void {
    this.editingPost = undefined;
    this.form.reset({
      title: '',
      slug: '',
      excerpt: '',
      coverImage: '',
      coverImageCaption: '',
      category: 'Style Guide',
      authorName: '',
      authorAvatar: '',
      authorBio: '',
      publishedAt: this.todayString(),
      readTime: '5 min read',
      tags: '',
      featured: false,
      contentJson: '[]',
    });
    this.formError = '';
  }

  editPost(post: BlogPost): void {
    this.editingPost = post;
    this.form.patchValue({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      coverImageCaption: post.coverImageCaption ?? '',
      category: post.category,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      authorBio: post.authorBio ?? '',
      publishedAt: this.formatDate(post.publishedAt),
      readTime: post.readTime,
      tags: post.tags.join(', '),
      featured: post.featured,
      contentJson: JSON.stringify(post.content ?? [], null, 2),
    });
    this.formError = '';
  }

  deletePost(post: BlogPost): void {
    const confirmed = window.confirm(`Delete "${post.title}"?`);
    if (!confirmed) {
      return;
    }

    this.blogPostsService.delete(post.id).subscribe(() => {
      this.loadPosts();
      if (this.editingPost?.id === post.id) {
        this.startNew();
      }
    });
  }

  savePost(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const parsedContent = this.parseContent(formValue.contentJson ?? '[]');
    if (!parsedContent) {
      return;
    }

    const publishedDateValue = formValue.publishedAt ?? this.todayString();
    const publishedAt = new Date(publishedDateValue);
    const publishedAtValue = Number.isNaN(publishedAt.getTime())
      ? new Date().toISOString()
      : publishedAt.toISOString();

    const payload: BlogPostPayload = {
      title: formValue.title ?? '',
      slug: formValue.slug ?? '',
      excerpt: formValue.excerpt ?? '',
      coverImage: formValue.coverImage ?? '',
      coverImageCaption: formValue.coverImageCaption ?? undefined,
      category: formValue.category ?? 'Style Guide',
      authorName: formValue.authorName ?? '',
      authorAvatar: formValue.authorAvatar ?? '',
      authorBio: formValue.authorBio ?? undefined,
      publishedAt: publishedAtValue,
      readTime: formValue.readTime ?? '',
      tags: this.parseTags(formValue.tags ?? ''),
      featured: Boolean(formValue.featured),
      content: parsedContent,
    };

    if (this.editingPost) {
      this.blogPostsService.update(this.editingPost.id, payload).subscribe(() => {
        this.loadPosts();
        this.formError = '';
      });
      return;
    }

    this.blogPostsService.create(payload).subscribe(() => {
      this.loadPosts();
      this.startNew();
    });
  }

  trackById(_: number, post: BlogPost): number {
    return post.id;
  }

  private loadPosts(): void {
    this.blogPostsService.getAll().subscribe((posts) => {
      this.posts = posts;
    });
  }

  private parseTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  private parseContent(value: string): BlogPost['content'] | null {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        this.formError = 'Content must be a JSON array of blocks.';
        return null;
      }
      this.formError = '';
      return parsed as BlogPost['content'];
    } catch {
      this.formError = 'Content JSON is invalid.';
      return null;
    }
  }

  private formatDate(date: Date): string {
    if (!date) {
      return this.todayString();
    }
    return new Date(date).toISOString().slice(0, 10);
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
