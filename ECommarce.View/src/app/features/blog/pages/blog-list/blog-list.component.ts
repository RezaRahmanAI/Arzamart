import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { BlogPost } from "../../blog.models";
import { BlogService } from "../../blog.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";

type BlogCategoryChip = {
  label: "All" | BlogPost["category"];
  icon: string;
};

import {
  LucideAngularModule,
  LayoutGrid,
  Shirt,
  Sparkles,
  Coffee,
  TrendingUp,
  Search,
  ArrowRight,
  ChevronDown,
  Mail,
} from "lucide-angular";

@Component({
  selector: "app-blog-list",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./blog-list.component.html",
})
export class BlogListComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly imageUrlService = inject(ImageUrlService);

  readonly icons: any = {
    LayoutGrid,
    Shirt,
    Sparkles,
    Coffee,
    TrendingUp,
    Search,
    ArrowRight,
    ChevronDown,
    Mail,
  };

  readonly categories: BlogCategoryChip[] = [
    { label: "All", icon: "LayoutGrid" },
    { label: "Style Guide", icon: "Shirt" },
    { label: "Faith", icon: "Sparkles" },
    { label: "Lifestyle", icon: "Coffee" },
    { label: "Trends", icon: "TrendingUp" },
  ];

  readonly searchControl = new FormControl("", { nonNullable: true });
  readonly newsletterForm = this.formBuilder.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });

  featuredPost?: BlogPost;
  posts: BlogPost[] = [];
  selectedCategory: BlogCategoryChip["label"] = "All";
  page = 1;
  readonly pageSize = 6;
  totalPosts = 0;
  hasMore = false;
  newsletterMessage = "";

  ngOnInit(): void {
    this.blogService
      .getFeaturedPost()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((post) => {
        this.featuredPost = post;
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tag = params.get("tag");
        const search = params.get("search");
        const value = tag ?? search ?? "";
        if (value !== this.searchControl.value) {
          this.searchControl.setValue(value, { emitEvent: false });
        }
        this.resetAndLoadPosts();
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.resetAndLoadPosts();
      });
  }

  onCategorySelect(category: BlogCategoryChip["label"]): void {
    this.selectedCategory = category;
    this.resetAndLoadPosts();
  }

  loadMore(): void {
    if (!this.hasMore) {
      return;
    }
    this.page += 1;
    this.loadPosts(false);
  }

  onNewsletterSubmit(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }

    this.newsletterMessage =
      "Thanks for subscribing! Check your inbox for the latest stories.";
    this.newsletterForm.reset();
  }

  trackBySlug(_: number, post: BlogPost): string {
    return post.slug;
  }

  getCategoryClasses(category: BlogCategoryChip["label"]): string {
    const isActive = category === this.selectedCategory;
    return isActive
      ? "flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors"
      : "flex h-9 items-center gap-2 rounded-full bg-[#e7f0f3] dark:bg-white/10 px-4 text-sm font-medium text-primary dark:text-white hover:bg-accent hover:text-primary transition-colors";
  }

  private resetAndLoadPosts(): void {
    this.page = 1;
    this.loadPosts(true);
  }

  private loadPosts(reset: boolean): void {
    this.blogService
      .getPosts({
        category: this.selectedCategory,
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.posts = reset ? result.posts : [...this.posts, ...result.posts];
        this.totalPosts = result.total;
        this.hasMore = this.posts.length < this.totalPosts;
      });
  }
}
