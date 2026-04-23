import { Component, inject, DestroyRef, OnInit } from "@angular/core";
import { AsyncPipe, NgClass, DecimalPipe, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpContext } from "@angular/common/http";
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
  tap,
  shareReplay,
  startWith,
  interval,
  Subject,
  takeUntil,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ProductService } from "../../../../core/services/product.service";
import { Product, ProductImage } from "../../../../core/models/product";
import { Review } from "../../../../core/models/review";
import { ReviewService } from "../../../../core/services/review.service";
import { CartService } from "../../../../core/services/cart.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { AnalyticsService } from "../../../../core/services/analytics.service";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";
import { SHOW_LOADING } from "../../../../core/services/loading.service";
import { sortProductSizes } from "../../../../core/constants/product.constants";

import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SizeGuideComponent } from "../../../../shared/components/size-guide/size-guide.component";
import { SafeHtmlPipe } from "../../../../shared/pipes/safe-html.pipe";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-product-details-page",
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    DecimalPipe,
    DatePipe,
    RouterLink,
    FormsModule,
    PriceDisplayComponent,
    ProductCardComponent,
    SizeGuideComponent,
    AppIconComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./product-details-page.component.html",
  styleUrl: "./product-details-page.component.css",
})
export class ProductDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly reviewService = inject(ReviewService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly siteSettingsService = inject(SiteSettingsService);
  readonly settings$ = this.siteSettingsService.getSettings();
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();

  isSizeGuideOpen = false;
  currentImageIndex = 0;
  isZooming = false;
  zoomX = 0;
  zoomY = 0;


  private readonly selectedSizeSubject = new BehaviorSubject<string | null>(
    null,
  );
  private readonly quantitySubject = new BehaviorSubject<number>(1);
  readonly quantity$ = this.quantitySubject.asObservable();
  private readonly selectedMediaSubject = new BehaviorSubject<string | null>(
    null,
  );

  product$ = this.route.paramMap.pipe(
    map((params) => params.get("slug") ?? ""),
    filter((slug) => slug.length > 0),
    switchMap((slug) =>
      this.productService.getBySlug(
        slug,
        new HttpContext().set(SHOW_LOADING, true),
      ),
    ),
    filter((product): product is Product => Boolean(product)),
    tap((product) => {
      const sizes = Array.from(
        new Set(product.variants?.map((v) => v.size).filter((s): s is string => !!s)),
      );
      const sortedSizes = sortProductSizes(sizes);
      this.selectedSizeSubject.next(sortedSizes[0] ?? null);

      this.quantitySubject.next(1);
      this.selectedMediaSubject.next(null); // Reset or set to first image
      this.currentImageIndex = 0;
      this.analyticsService.trackViewContent(product);
      this.startAutoSlide(product);
    }),
    shareReplay(1),
  );

  reviews$ = this.product$.pipe(
    switchMap((product) =>
      this.productService.getReviewsByProductId(product.id),
    ),
  );

  relatedProducts$ = this.product$.pipe(
    switchMap((product) => {
      if (product.collectionId) {
        return this.productService
          .getRelatedProducts(product.collectionId, undefined, 4)
          .pipe(map((res) => res.data));
      } else if (product.categoryId) {
        return this.productService
          .getRelatedProducts(undefined, product.categoryId, 4)
          .pipe(map((res) => res.data));
      }
      return of([]);
    }),
    startWith([] as Product[]),
  );

  readonly vm$ = combineLatest([
    this.product$,
    this.selectedSizeSubject,
    this.quantitySubject,
    this.selectedMediaSubject,
    this.relatedProducts$,
  ]).pipe(
    map(
      ([
        product,
        selectedSize,
        quantity,
        selectedMedia,
        relatedProducts,
      ]) => {


        const uniqueSizes = Array.from(
          new Set(product.variants?.map((v) => v.size).filter((s): s is string => !!s)),
        );
        const sortedUniqueSizes = sortProductSizes(uniqueSizes);

        const selectedVariant = product.variants?.find(
          (v) =>
            (v.size || "").trim().toLowerCase() ===
            (selectedSize || "").trim().toLowerCase(),
        );
        const currentStock = selectedVariant
          ? selectedVariant.stockQuantity
          : product.stockQuantity;

        // Use variant price if available and > 0, fallback to product price
        const currentPrice =
          (selectedVariant?.price ?? 0) > 0
            ? selectedVariant!.price!
            : product.price;
        const currentCompareAtPrice =
          (selectedVariant?.compareAtPrice ?? 0) > 0
            ? selectedVariant!.compareAtPrice!
            : product.compareAtPrice;

        return {
          product,
          selectedSize,
          quantity,
          currentStock,
          currentPrice,
          currentCompareAtPrice,
          selectedMedia: this.ensureSelectedMedia(product, selectedMedia),
          gallery: this.buildGallery(product),
          uniqueSizes: sortedUniqueSizes,
          relatedProducts,
        };
      },
    ),
  );

  selectionError = "";

  fullStars(rating: number): number[] {
    return Array.from({ length: Math.floor(rating) }, (_, index) => index);
  }

  hasHalfStar(rating: number): boolean {
    return rating % 1 >= 0.5;
  }

  emptyStars(rating: number): number[] {
    const full = Math.floor(rating);
    const half = this.hasHalfStar(rating) ? 1 : 0;
    return Array.from(
      { length: Math.max(0, 5 - full - half) },
      (_, index) => index,
    );
  }

  hasDiscount(product: Product): boolean {
    return !!(
      product.compareAtPrice &&
      product.compareAtPrice > 0 &&
      product.compareAtPrice > product.price
    );
  }

  getDiscountPercentage(product: {
    price: number;
    compareAtPrice?: number;
  }): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price)
      return 0;
    const discount = product.compareAtPrice - product.price;
    return Math.round((discount / product.compareAtPrice) * 100);
  }

  getDiscountAmount(product: {
    price: number;
    compareAtPrice?: number;
  }): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price)
      return 0;
    return product.compareAtPrice - product.price;
  }



  selectedSizeLabel(
    product: Product | null,
    selectedSize: string | null,
  ): string {
    if (selectedSize) return selectedSize;
    const sizes = Array.from(
      new Set(product?.variants?.map((v) => v.size).filter(Boolean)),
    );
    return sizes[0] ?? "";
  }



  selectSize(sizeLabel: string): void {
    this.selectedSizeSubject.next(sizeLabel);
    this.selectionError = "";
  }

  selectMedia(mediaUrl: string): void {
    this.selectedMediaSubject.next(mediaUrl);
  }

  increaseQuantity(): void {
    this.quantitySubject.next(this.quantitySubject.getValue() + 1);
  }

  decreaseQuantity(): void {
    this.quantitySubject.next(Math.max(1, this.quantitySubject.getValue() - 1));
  }

  addToCart(product: Product | null): void {
    if (!product) {
      return;
    }
    const selectedSize = this.selectedSizeSubject.getValue();

    // Size remains strictly mandatory
    if (!selectedSize && product.variants?.length) {
      this.selectionError = "Please select a size before adding to cart.";
      return;
    }

    const quantity = this.quantitySubject.getValue();
    this.cartService
      .addItem(
        product,
        quantity,
        selectedSize ?? undefined,
      )
      .subscribe();

    // Show success notification
    this.notificationService.success(
      `Added ${quantity} x ${product.name} to your bag`,
    );

    this.selectionError = "";
  }

  buyNow(product: Product | null): void {
    this.addToCart(product);
    if (!this.selectionError) {
      void this.router.navigateByUrl("/checkout");
    }
  }

  getWhatsAppUrl(product: Product, whatsAppNumber: string | undefined): string {
    const phone = (whatsAppNumber || "").replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hi, I'm interested in "${product.name}" (${product.sku || ""}).\nPrice: ৳${product.price}\nPlease share more details.`,
    );
    return `https://wa.me/${phone}?text=${message}`;
  }

  trackReview(_: number, review: Review): number {
    return review.id;
  }

  scrollToReviews(): void {
    const reviewsSection: HTMLElement | null = document.getElementById("reviews");
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth" });
    }
  }



  openSizeGuide(): void {
    this.isSizeGuideOpen = true;
  }

  closeSizeGuide(): void {
    this.isSizeGuideOpen = false;
  }

  prevImage(gallery: string[]): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + gallery.length) % gallery.length;
  }

  nextImage(gallery: string[]): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % gallery.length;
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  private startAutoSlide(product: Product): void {
    const gallery = this.buildGallery(product);
    if (gallery.length <= 1) return;

    interval(4000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isZooming) {
          this.nextImage(gallery);
        }
      });
  }

  handleMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomX = x;
    this.zoomY = y;
  }

  toggleZoom(state: boolean): void {
    this.isZooming = state;
  }

  private buildGallery(product: Product): string[] {
    const images = product.images?.map((i: ProductImage) => i.imageUrl) ?? [];
    // For vertical stack, we want the main image first, then the rest
    let gallery: string[] = [];
    if (product.imageUrl) {
      gallery.push(product.imageUrl);
    }
    // Add other images, avoiding duplicates
    images.forEach((img: string) => {
      if (img !== product.imageUrl) {
        gallery.push(img);
      }
    });
    return gallery;
  }

  private ensureSelectedMedia(
    product: Product,
    selectedMedia: string | null,
  ): string | null {
    // For the vertical stack, selectedMedia is less relevant for display swapping,
    // but we can keep it if we want to highlight or scroll to an image later.
    return selectedMedia ?? product.imageUrl ?? null;
  }
  // Review Logic
  isReviewFormOpen = false;
  reviewRating = 5;
  reviewComment = "";
  reviewName = "";
  reviewError = "";
  isSubmittingReview = false;

  toggleReviewForm(): void {
    this.isReviewFormOpen = !this.isReviewFormOpen;
    if (!this.isReviewFormOpen) {
      this.reviewError = "";
    }
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(productId: number): void {
    if (!this.reviewName.trim() || !this.reviewComment.trim()) {
      this.reviewError = "Please provide your name and a comment.";
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = "";

    const review: any = {
      productId,
      customerName: this.reviewName,
      rating: this.reviewRating,
      comment: this.reviewComment,
    };

    this.reviewService.addReview(productId, review).subscribe({
      next: (newReview: Review) => {
        this.isSubmittingReview = false;
        this.isReviewFormOpen = false;
        this.reviewComment = "";
        this.reviewName = "";
        this.reviewRating = 5;

        // Refresh reviews
        window.location.reload();
      },
      error: (err: unknown) => {
        this.isSubmittingReview = false;
        this.reviewError = "Failed to submit review. Please try again.";
        console.error(err);
      },
    });
  }
}
