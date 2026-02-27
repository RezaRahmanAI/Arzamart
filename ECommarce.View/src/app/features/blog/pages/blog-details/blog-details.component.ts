import { CommonModule, DOCUMENT } from "@angular/common";
import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { of, switchMap } from "rxjs";

import { BlogContentBlock, BlogPost } from "../../blog.models";
import { BlogService } from "../../blog.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";

type BlogComment = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  avatarUrl?: string;
  initials?: string;
  replies?: BlogComment[];
  isAuthor?: boolean;
};

import { LucideAngularModule, Share2 } from "lucide-angular";

@Component({
  selector: "app-blog-details",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./blog-details.component.html",
})
export class BlogDetailsComponent implements OnInit {
  readonly icons = {
    Share2,
  };
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  readonly imageUrlService = inject(ImageUrlService);
  private settingsService = inject(SiteSettingsService);
  settings$ = this.settingsService.getSettings();

  post?: BlogPost;
  contentBlocks: BlogContentBlock[] = [];
  relatedPosts: BlogPost[] = [];
  shareMessage = "";
  replyMessage = "";
  notFound = false;
  websiteName = "";

  readonly commentForm = this.formBuilder.nonNullable.group({
    name: ["", [Validators.required]],
    email: ["", [Validators.required, Validators.email]],
    comment: ["", [Validators.required]],
  });

  readonly newsletterForm = this.formBuilder.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });

  newsletterMessage = "";

  comments: BlogComment[] = [
    {
      id: 1,
      name: "Sarah J.",
      message:
        "Absolutely love this article! The layering tips are exactly what I needed for the upcoming chilly weather. Especially the point about mixing textures.",
      createdAt: "2 days ago",
      initials: "S",
    },
    {
      id: 2,
      name: "Fatima Al-Sayed",
      message:
        'The "Golden Hour Scarf" is stunning. Just ordered mine! Can you do a post about shoe pairings for these long skirts?',
      createdAt: "1 day ago",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDV9doAPdmq0Mhoz9MdzLZ55dytifnuvnXIRqcYIp5muaUQ_gv1RglXDBfjIpZVnJbcqkj-OYpTPKReN_C9sDdBYtDLY9vgf8w8fNIpDBKLhxHJ99huwZgxGIZ4aY_q0BAsZUmMxAoosLwrBTWDHLjEq1-ROR47dzaGMfHrHXQj1ZCKIvnU1Ct-wULGCtLkeerhzTJzgfYPYuRR-j_Sxxbg37gI6zGtRmCuJm1gkxd5Ps9MrdJQbGVBvfk0rsWNhj0QO_I9U-woIaQ",
      replies: [
        {
          id: 3,
          name: "Amina Khan",
          message:
            "Thank you, Fatima! That's a great suggestion. I'll definitely add shoe pairings to our content calendar.",
          createdAt: "1 day ago",
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuD5VWDVs8SwN-JYR1w-AdZ7wgz0ZWv7mNJwBR8Nv1EUAlr1yTmrjIWOAFVFIIlqC-H7r31bFT2bwc6Ce2uMGM8ueve_Vbtk4L2wqfc6lrf4gAgXSLWP5Bz0gpqqOrJ7UMkSi5nbWRk2VXbcQPELG-U61L4D9MGAvoEGZK4RyalMRcddyUVExIj8sX8uM3f1jstB91qGbjWo6tcUn1zRTu-w21R-nFOZ6ci3-CC_25Rut7Xkywn4BdLishSvvSKXr2s7uBvclqTg-bg",
          isAuthor: true,
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const slug = params.get("slug");
          if (!slug) {
            this.notFound = true;
            return of({ post: undefined, related: [] as BlogPost[] });
          }

          return this.blogService.getPostBySlug(slug).pipe(
            switchMap((post) => {
              if (!post) {
                this.notFound = true;
                return of({ post: undefined, related: [] as BlogPost[] });
              }

              return this.blogService
                .getRelatedPosts(slug, 3)
                .pipe(switchMap((related) => of({ post, related })));
            }),
          );
        }),
      )
      .subscribe(({ post, related }) => {
        if (!post) {
          this.post = undefined;
          this.relatedPosts = [];
          this.contentBlocks = [];
          this.notFound = true;
          return;
        }

        this.post = post;
        this.contentBlocks = post.content ?? [];
        this.relatedPosts = related;
        this.notFound = false;
        this.shareMessage = "";
        this.replyMessage = "";
      });

    this.settingsService.getSettings().subscribe((settings) => {
      this.websiteName = settings.websiteName || "ArzaMart";
    });
  }

  get shareUrl(): string {
    return this.document.location.href;
  }

  get totalComments(): number {
    return this.comments.reduce(
      (total, comment) => total + 1 + (comment.replies?.length ?? 0),
      0,
    );
  }

  onCommentSubmit(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const { name, comment } = this.commentForm.getRawValue();
    const initials = name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    this.comments = [
      {
        id: Date.now(),
        name,
        message: comment,
        createdAt: "Just now",
        initials,
      },
      ...this.comments,
    ];

    this.commentForm.reset();
  }

  onReplyClick(): void {
    this.replyMessage = "Reply coming soon.";
  }

  onNewsletterSubmit(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }

    this.newsletterMessage =
      "Thanks for joining! Your next dose of inspiration is on the way.";
    this.newsletterForm.reset();
  }

  async copyShareLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.shareMessage = "Link copied to clipboard.";
    } catch {
      this.shareMessage = "Unable to copy link. Please try again.";
    }
  }

  shareOn(platform: "pinterest" | "facebook" | "twitter"): void {
    const url = this.buildShareUrl(platform);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  private buildShareUrl(
    platform: "pinterest" | "facebook" | "twitter",
  ): string {
    const encodedUrl = encodeURIComponent(this.shareUrl);
    const websiteName = this.websiteName || "ArzaMart";
    const title = encodeURIComponent(this.post?.title ?? `${websiteName} Blog`);

    switch (platform) {
      case "pinterest":
        return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${title}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`;
      default:
        return encodedUrl;
    }
  }
}
