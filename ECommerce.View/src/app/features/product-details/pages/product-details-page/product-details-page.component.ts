import { Component, ChangeDetectionStrategy, inject, DestroyRef, OnInit, OnDestroy } from "@angular/core";
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
  catchError,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ProductService } from "../../../../core/services/product.service";
import { Product, ProductImage } from "../../../../core/models/product";
import { Review } from "../../../../core/models/review";
import { ReviewService } from "../../../../core/services/review.service";
import { AuthService } from "../../../../core/services/auth.service";
import { CustomerProfileService } from "../../../../core/services/customer-profile.service";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ProductDetailsPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly reviewService = inject(ReviewService);
  private readonly notificationService = inject(NotificationService);
  readonly router = inject(Router);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly siteSettingsService = inject(SiteSettingsService);
  readonly settings$ = this.siteSettingsService.getSettings();
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();
  watchingCount: number = Math.floor(Math.random() * (45 - 15 + 1) + 15);
  private watchingInterval: any;

  private readonly authService = inject(AuthService);
  readonly isLoggedIn$ = this.authService.isLoggedIn$;

  isPhoneLoginFormOpen = false;
  loginPhone = "";
  isLoggingInPhone = false;
  phoneLoginError = "";

  isSignupFormOpen = false;
  signupName = "";
  signupAddress = "";
  isSigningUp = false;
  signupError = "";

  private readonly profileService = inject(CustomerProfileService);


  ngOnInit(): void {
    this.startWatchingFluctuation();
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.reviewName = currentUser.fullName || currentUser.name || '';
    }
  }

  ngOnDestroy(): void {
    if (this.watchingInterval) clearInterval(this.watchingInterval);
  }

  private startWatchingFluctuation(): void {
    this.watchingInterval = setInterval(() => {
      const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
      this.watchingCount = Math.max(12, Math.min(65, this.watchingCount + change));
    }, 7000);
  }

  isSizeGuideOpen = false;
  currentImageIndex = 0;
  slideProgress = 0;
  isPaused = false;
  private autoSlideSub: any;


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
      this.selectedSizeSubject.next(null); // No size selected by default as per user request

      this.quantitySubject.next(1);
      this.selectedMediaSubject.next(null); // Reset or set to first image
      this.currentImageIndex = 0;
      this.analyticsService.trackViewContent(product);
      this.startAutoSlide(product);
    }),
    shareReplay(1),
  );

  private readonly refreshReviewsSubject = new BehaviorSubject<void>(void 0);

  reviews$ = combineLatest([
    this.product$,
    this.refreshReviewsSubject
  ]).pipe(
    switchMap(([product]) =>
      this.reviewService.getReviewsByProductId(product.id)
    ),
    shareReplay(1)
  );


  relatedProducts$ = this.product$.pipe(
    switchMap((product) => {
      // Extract code from name (e.g., "KPLZ01" from "KPLZ01 Black Wash")
      const nameParts = (product.name || "").trim().split(" ");
      const nameCode = (nameParts.length > 0 && nameParts[0].length >= 3) ? nameParts[0] : null;

      // 1. If we have a code, search by code (broadest match for same-style items)
      if (nameCode) {
        return this.productService
          .getRelatedProducts(undefined, undefined, undefined, 12, nameCode)
          .pipe(
            map((res) => res.data.filter((p) => p.id !== product.id))
          );
      }
      
      // 2. Fallback to Product Group (manual link)
      if (product.productGroupId) {
        return this.productService
          .getRelatedProducts(undefined, undefined, product.productGroupId, 12)
          .pipe(
            map((res) => res.data.filter((p) => p.id !== product.id))
          );
      } 
      
      // 3. Fallback to Collection
      if (product.collectionId) {
        return this.productService
          .getRelatedProducts(product.collectionId, undefined, undefined, 4)
          .pipe(map((res) => res.data));
      } 
      
      // 4. Fallback to Category
      if (product.categoryId) {
        return this.productService
          .getRelatedProducts(undefined, product.categoryId, undefined, 4)
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
    this.reviews$,
    this.isLoggedIn$,
  ]).pipe(
    map(
      ([
        product,
        selectedSize,
        quantity,
        selectedMedia,
        relatedProducts,
        reviews,
        isLoggedIn,
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

        const sortedVariants = product.variants ? sortProductSizes(product.variants.map(v => v.size || ""))
          .map(size => product.variants.find(v => (v.size || "") === size)!)
          .filter(v => !!v) : [];
        const smallestVariant = sortedVariants[0];

        // Use variant price if available and > 0, fallback to smallest variant or product price
        const currentPrice =
          (selectedVariant?.price ?? 0) > 0
            ? selectedVariant!.price!
            : (smallestVariant?.price ?? product.price);
        const currentCompareAtPrice =
          (selectedVariant?.compareAtPrice ?? 0) > 0
            ? selectedVariant!.compareAtPrice!
            : (smallestVariant?.compareAtPrice ?? product.compareAtPrice);

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
          : 0;

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
          reviews,
          isLoggedIn,
          averageRating,
          totalReviews
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

  getRatingCount(reviews: Review[] | undefined, rating: number): number {
    return reviews ? reviews.filter(r => Math.round(r.rating) === rating).length : 0;
  }

  getStarIcon(rating: number, star: number): string {
    if (rating >= star) {
      return 'Star';
    }
    if (rating + 0.5 >= star) {
      return 'StarHalf';
    }
    return 'Star';
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
      this.notificationService.warn("Please select a size first");
      this.selectionError = "Size required";
      return;
    }

    const quantity = this.quantitySubject.getValue();
    this.cartService
      .addItem(
        product,
        quantity,
        selectedSize ?? undefined,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.selectionError = "";
  }

  buyNow(product: Product | null): void {
    this.addToCart(product);
    if (!this.selectionError) {
      void this.router.navigateByUrl("/cart");
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
    this.resetProgress();
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
    this.resetProgress();
  }

  private resetProgress(): void {
    this.slideProgress = 0;
  }

  private startAutoSlide(product: Product): void {
    const gallery = this.buildGallery(product);
    if (gallery.length <= 1) return;

    if (this.autoSlideSub) {
      this.autoSlideSub.unsubscribe();
    }

    // 4000ms / 16ms = 250 steps
    const step = 100 / (4000 / 16);

    this.autoSlideSub = interval(16)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isPaused) {
          this.slideProgress += step;
          if (this.slideProgress >= 100) {
            this.nextImage(gallery);
            this.slideProgress = 0;
          }
        }
      });
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
  isLightboxOpen = false;
  lightboxIndex = 0;
  reviewRating = 5;
  reviewComment = "";
  reviewName = "";
  reviewError = "";
  isSubmittingReview = false;

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.isLightboxOpen = true;
    document.body.style.overflow = "hidden";
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
    document.body.style.overflow = "";
  }

  nextLightbox(gallery: string[]): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % gallery.length;
  }

  prevLightbox(gallery: string[]): void {
    this.lightboxIndex =
      (this.lightboxIndex - 1 + gallery.length) % gallery.length;
  }

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

    this.reviewService.addReview(productId, review).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (newReview: Review) => {
        this.isSubmittingReview = false;
        this.isReviewFormOpen = false;
        this.reviewComment = "";
        const currentUser = this.authService.getCurrentUser();
        this.reviewName = currentUser ? (currentUser.fullName || currentUser.name || '') : "";
        this.reviewRating = 5;
        this.refreshReviewsSubject.next();
      },
      error: (err: unknown) => {
        this.isSubmittingReview = false;
        this.reviewError = "Failed to submit review. Please try again.";
        console.error(err);
      },
    });
  }

  submitPhoneLogin(): void {
    if (!this.loginPhone.trim()) {
      this.phoneLoginError = "Please enter your phone number.";
      return;
    }

    this.isLoggingInPhone = true;
    this.phoneLoginError = "";

    const phone = this.loginPhone.trim();

    this.authService.customerPhoneLogin(phone).subscribe({
      next: (user) => {
        if (user) {
          this.profileService.getProfile(phone).subscribe({
            next: (profile) => {
              this.isLoggingInPhone = false;
              if (profile && profile.name && profile.name !== "Guest Customer") {
                this.isPhoneLoginFormOpen = false;
                this.isSignupFormOpen = false;
                this.isReviewFormOpen = true;
                this.reviewName = profile.name;
                this.loginPhone = "";
              } else {
                this.isSignupFormOpen = true;
                this.signupName = "";
                this.signupAddress = profile?.address || "";
              }
            },
            error: () => {
              this.isLoggingInPhone = false;
              this.isSignupFormOpen = true;
              this.signupName = "";
              this.signupAddress = "";
            }
          });
        } else {
          this.isLoggingInPhone = false;
          this.phoneLoginError = "Failed to log in. Please check your phone number.";
        }
      },
      error: (err: any) => {
        this.isLoggingInPhone = false;
        this.phoneLoginError = err.error?.message || "Failed to log in. Please try again.";
        console.error(err);
      }
    });
  }

  submitSignup(): void {
    if (!this.signupName.trim()) {
      this.signupError = "Please enter your name.";
      return;
    }

    this.isSigningUp = true;
    this.signupError = "";

    const phone = localStorage.getItem('customer_phone') || this.loginPhone.trim();
    if (!phone) {
      this.isSigningUp = false;
      this.signupError = "Phone number is missing. Please start again.";
      return;
    }

    const request = {
      phone: phone,
      name: this.signupName.trim(),
      address: this.signupAddress.trim()
    };

    this.profileService.updateProfile(request).subscribe({
      next: (profile) => {
        this.isSigningUp = false;
        this.isPhoneLoginFormOpen = false;
        this.isSignupFormOpen = false;
        this.isReviewFormOpen = true;
        this.reviewName = profile.name;
        this.loginPhone = "";
      },
      error: (err) => {
        this.isSigningUp = false;
        this.signupError = "Failed to save details. Please try again.";
        console.error(err);
      }
    });
  }

  logoutCustomer(): void {
    this.authService.logout();
    localStorage.removeItem('customer_phone');
    this.isReviewFormOpen = false;
    this.isPhoneLoginFormOpen = false;
    this.isSignupFormOpen = false;
    this.reviewName = "";
  }
}
