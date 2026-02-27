import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
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
} from "rxjs";

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

import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SizeGuideComponent } from "../../../../shared/components/size-guide/size-guide.component";
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Star,
  Plus,
  Minus,
  Maximize2,
  Loader2,
  MessageCircle,
} from "lucide-angular";

@Component({
  selector: "app-product-details-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PriceDisplayComponent,
    ProductCardComponent,
    SizeGuideComponent,
    LucideAngularModule,
  ],
  templateUrl: "./product-details-page.component.html",
  styleUrl: "./product-details-page.component.css",
})
export class ProductDetailsPageComponent {
  readonly icons = {
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    CreditCard,
    Star,
    Plus,
    Minus,
    Maximize2,
    Loader2,
    MessageCircle,
  };
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

  isSizeGuideOpen = false;
  currentImageIndex = 0;

  private readonly selectedColorSubject = new BehaviorSubject<{
    name: string;
    hex: string;
  } | null>(null);
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
      const colors = Array.from(
        new Set(product.images?.map((i) => i.color).filter(Boolean)),
      );
      this.selectedColorSubject.next(
        colors[0] ? { name: colors[0]!, hex: "" } : null,
      );

      const sizes = Array.from(
        new Set(product.variants?.map((v) => v.size).filter(Boolean)),
      );
      // Sort sizes to select smallest first
      const sizeOrder = [
        "xs",
        "s",
        "m",
        "l",
        "xl",
        "xxl",
        "2xl",
        "3xl",
        "4xl",
        "5xl",
      ];
      const sortedSizes = [...sizes].sort((a, b) => {
        const aIdx = sizeOrder.indexOf((a || "").toLowerCase());
        const bIdx = sizeOrder.indexOf((b || "").toLowerCase());
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return (a || "").localeCompare(b || "");
      });
      this.selectedSizeSubject.next(sortedSizes[0] ?? null);

      this.quantitySubject.next(1);
      this.selectedMediaSubject.next(null); // Reset or set to first image
      this.currentImageIndex = 0;
      this.analyticsService.trackViewContent(product);
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
    this.selectedColorSubject,
    this.selectedSizeSubject,
    this.quantitySubject,
    this.selectedMediaSubject,
    this.relatedProducts$,
  ]).pipe(
    map(
      ([
        product,
        selectedColor,
        selectedSize,
        quantity,
        selectedMedia,
        relatedProducts,
      ]) => {
        const uniqueColors = Array.from(
          new Set(product.images?.map((i) => i.color).filter(Boolean)),
        ).map((color) => ({ name: color!, hex: "" }));

        const uniqueSizes = Array.from(
          new Set(product.variants?.map((v) => v.size).filter(Boolean)),
        );
        // Sort sizes consistently
        const sizeOrder = [
          "xs",
          "s",
          "m",
          "l",
          "xl",
          "xxl",
          "2xl",
          "3xl",
          "4xl",
          "5xl",
        ];
        const sortedUniqueSizes = [...uniqueSizes].sort((a, b) => {
          const aIdx = sizeOrder.indexOf((a || "").toLowerCase());
          const bIdx = sizeOrder.indexOf((b || "").toLowerCase());
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return (a || "").localeCompare(b || "");
        });

        const selectedVariant = product.variants?.find(
          (v) => v.size === selectedSize,
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
          selectedColor,
          selectedSize,
          quantity,
          currentStock,
          currentPrice,
          currentCompareAtPrice,
          selectedMedia: this.ensureSelectedMedia(product, selectedMedia),
          gallery: this.buildGallery(product),
          uniqueColors,
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

  selectedColorName(
    product: Product | null,
    selectedColor: { name: string } | null,
  ): string {
    if (selectedColor) return selectedColor.name;
    const colors = Array.from(
      new Set(product?.images?.map((i) => i.color).filter(Boolean)),
    );
    return colors[0] ?? "";
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

  selectColor(color: { name: string; hex: string }, product: Product): void {
    this.selectedColorSubject.next(color);
    this.selectionError = "";

    // Switch to the image associated with this color
    if (product.images) {
      const colorImage = product.images.find((i) => i.color === color.name);
      if (colorImage) {
        const gallery = this.buildGallery(product);
        const index = gallery.findIndex((url) => url === colorImage.imageUrl);
        if (index !== -1) {
          this.currentImageIndex = index;
        }
      }
    }
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
    const selectedColor = this.selectedColorSubject.getValue();
    const selectedSize = this.selectedSizeSubject.getValue();

    // Logic to match uniqueColors and uniqueSizes used in template
    const uniqueColorsCount = Array.from(
      new Set(product.images?.map((i) => i.color).filter(Boolean)),
    ).length;
    const uniqueSizesCount = Array.from(
      new Set(product.variants?.map((v) => v.size).filter(Boolean)),
    ).length;

    const isColorRequired = uniqueColorsCount > 0;
    const isSizeRequired = uniqueSizesCount > 0;

    if (
      (isColorRequired && !selectedColor) ||
      (isSizeRequired && !selectedSize)
    ) {
      if (isColorRequired && isSizeRequired) {
        this.selectionError =
          "Please select a color and size before adding to cart.";
      } else if (isColorRequired) {
        this.selectionError = "Please select a color before adding to cart.";
      } else {
        this.selectionError = "Please select a size before adding to cart.";
      }
      return;
    }
    const quantity = this.quantitySubject.getValue();
    this.cartService
      .addItem(
        product,
        quantity,
        selectedColor?.name ?? undefined,
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
    const reviewsSection = document.getElementById("reviews");
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  getColorImage(product: Product, color: string): string | null {
    if (!product?.images) return null;
    const img = product.images.find((i) => i.color === color);
    return img ? this.imageUrlService.getImageUrl(img.imageUrl) : null;
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

  private buildGallery(product: Product): string[] {
    const images = product.images?.map((i) => i.imageUrl) ?? [];
    // For vertical stack, we want the main image first, then the rest
    let gallery = [];
    if (product.imageUrl) {
      gallery.push(product.imageUrl);
    }
    // Add other images, avoiding duplicates
    images.forEach((img) => {
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
