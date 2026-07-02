import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Subject, combineLatest, of } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { ProductsService } from "../../services/products.service";
import { CustomLandingPageService } from "../../services/custom-landing-page.service";
import { CustomLandingPageConfig, LandingPageData, LandingSection } from "../../../core/models/landing-page";
import { Product } from "../../../core/models/product";
import { NotificationService } from "../../../core/services/notification.service";
import { CustomLandingPageEditorComponent } from "../../../features/landing-page/pages/custom-landing-page/components/custom-landing-page-editor/custom-landing-page-editor.component";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-landing-page-design",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CustomLandingPageEditorComponent, AppIconComponent],
  templateUrl: "./landing-page-design.component.html",
  styleUrl: "./landing-page-design.component.css"
})
export class LandingPageDesignComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  onCloseEditor(): void {
    void this.router.navigate(["/admin/products"]);
  }
  private readonly productsService = inject(ProductsService);
  private readonly customLandingPageService = inject(CustomLandingPageService);
  private readonly notification = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild("previewIframe") previewIframe!: ElementRef<HTMLIFrameElement>;

  product: Product | null = null;
  config: CustomLandingPageConfig | null = null;
  sections: LandingSection[] = [
    { id: 'marquee',        type: 'marquee',        label: '💬 Marquee Bar',         visible: true },
    { id: 'countdown',      type: 'countdown',      label: '⏱ Countdown Bar',       visible: true },
    { id: 'hero',           type: 'hero',           label: '🎯 Hero / Offer',         visible: true },
    { id: 'product-hero',   type: 'product-hero',   label: '🛍 Product Hero',         visible: true },
    { id: 'discount-cta',   type: 'discount-cta',   label: '💚 Discount CTA',         visible: true },
    { id: 'info-banner',    type: 'info-banner',    label: '🟡 Info Banner',          visible: true },
    { id: 'trust-banner',   type: 'trust-banner',   label: '🛡️ Trust Banner',        visible: true },
    { id: 'product-select', type: 'product-select', label: '📦 Product Selection',    visible: true },
    { id: 'reviews',        type: 'reviews',        label: '💬 Customer Reviews',     visible: false },
    { id: 'order-form',     type: 'order-form',     label: '📝 Order Form',           visible: true },
  ];

  allProducts: Product[] = [];
  defaultRelatedProducts: Product[] = [];
  
  isLoading = true;
  isSaving = false;
  isProductSelectionLoading = false;
  previewUrl: SafeResourceUrl | null = null;
  previewDevice: "desktop" | "tablet" | "mobile" = "desktop";

  readonly configForm = this.fb.nonNullable.group({
    relativeTimerTotalMinutes: [null as number | null],
    isTimerVisible: [true],
    headerTitle: ["অফারটি শেষ হতে মাত্র কিছুক্ষণ বাকি আছে!"],
    isProductDetailsVisible: [true],
    productDetailsTitle: ["🔥 প্রোডাক্ট ডিটেইলস"],
    isFabricVisible: [true],
    isDesignVisible: [true],
    isTrustBannerVisible: [true],
    trustBannerText: ["দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই"],
    featuredProductName: [""],
    promoPrice: [0],
    originalPrice: [0],
    isMarqueeVisible: [false],
    marqueeText: ["🔥 সীমিত স্টক — মাত্র ৩৪টি বাকি! 🚚 সারা বাংলাদেশে ফ্রি ডেলিভারি 💥 আজকের জন্য ৩০% ছাড় — মধ্যরাতে শেষ 💵 ক্যাশ অন ডেলিভারি আছে ⚡"],
    promoText: ["যেকোনো কালার যেকোনো সাইজ দুই পিস অর্ডার করলেই পাচ্ছেন মাত্র ১৪৫০ টাকা"],
    freeShippingThresholdQuantity: [null as number | null],
    isReviewsVisible: [true],
    heroTitle: ["একচেটিয়া অফার! আজকের জন্যই সেরা সুযোগ"],
    heroSubtitle: ["প্রিমিয়াম কোয়ালিটি এখন সাশ্রয়ী মূল্যে"],
    heroBadge: ["স্টক ফুরিয়ে যাওয়ার আগেই সংগ্রহ করুন"],
    productHeroTitle: ["আমাদের প্রিমিয়াম প্রসাধনী"],
    productHeroDescription: ["সেরা উপাদান দিয়ে তৈরি যা আপনার ত্বকের যত্ন নেবে। আমাদের হাজার হাজার সন্তুষ্ট গ্রাহকের তালিকায় আপনিও যুক্ত হোন।"],
    discountCtaTitle: ["অবিশ্বাস্য ডিসকাউন্ট অফার!"],
    discountCtaDescription: ["আপনি কি সেরা কোয়ালিটির পণ্যটি খুঁজছেন? আজই অর্ডার করলে পাবেন বিশেষ ছাড় এবং ফ্রি ডেলিভারি।"],
    infoBannerTitle: ["প্রোডাক্ট ব্যবহারের নিয়মাবলী"],
    infoBannerDescription: ["প্রতিদিন সকালে ও রাতে পরিষ্কার ত্বকে অল্প পরিমাণে ক্রিম লাগিয়ে আলতোভাবে ম্যাসাজ করুন। নিয়মিত ব্যবহারে আপনি দৃশ্যমান পরিবর্তন লক্ষ্য করবেন। আমাদের পণ্যগুলি ১০০% প্রাকৃতিক উপাদান দিয়ে তৈরি।"],
    sectionsJson: [""],
  });

  debugLogs: string[] = [];

  addLog(msg: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.debugLogs.push(`[${timestamp}] ${msg}`);
    console.log(`[LandingPageDesign] ${msg}`);
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    // Add global window error listeners to capture silent exceptions
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.addLog(`GLOBAL JS ERROR: ${event.message} at ${event.filename}:${event.lineno}`);
      });
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const msg = reason?.message || (typeof reason === "string" ? reason : "Unknown Promise Rejection");
        this.addLog(`GLOBAL UNHANDLED REJECTION: ${msg}`);
      });
    }

    this.addLog("ngOnInit started");
    
    // Direct window.fetch diagnostic
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("arza_token");
      this.addLog(`Direct Fetch Token: ${token ? token.substring(0, 15) + "..." : "null"}`);
      
      window.fetch("/api/admin/products/6", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        this.addLog(`Direct Fetch HTTP Status: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        this.addLog(`Direct Fetch SUCCESS: ${data?.name}`);
      })
      .catch(err => {
        this.addLog(`Direct Fetch ERROR: ${err?.message || err}`);
      });
    }

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idStr = params.get("id");
      this.addLog(`Route param id: ${idStr}`);
      if (idStr) {
        const id = parseInt(idStr, 10);
        this.addLog(`Parsed ID: ${id}`);
        if (id) {
          this.loadData(id);
        } else {
          this.addLog("Invalid product ID parsed");
        }
      } else {
        this.addLog("No ID parameter in route");
      }
    });

    // Listen to form value changes and update the preview window in real-time
    this.configForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.sendConfigToPreview();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(productId: number): void {
    this.isLoading = true;
    this.addLog(`loadData started for product ID: ${productId}`);

    const product$ = this.productsService.getProductById(productId).pipe(
      takeUntil(this.destroy$),
      tap({
        next: (prod: any) => this.addLog(`getProductById SUCCESS: ${prod?.name}`),
        error: (err: any) => this.addLog(`getProductById ERROR: ${JSON.stringify(err)}`)
      })
    );

    const config$ = this.customLandingPageService.getConfig(productId).pipe(
      takeUntil(this.destroy$),
      tap({
        next: (cfg: any) => this.addLog(`getConfig SUCCESS: ${cfg ? "Found" : "Not Found"}`),
        error: (err: any) => this.addLog(`getConfig ERROR: ${JSON.stringify(err)}`)
      })
    );

    const allProds$ = this.productsService.getProducts({ 
      searchTerm: "", 
      category: "all", 
      subCategory: "all", 
      statusTab: "all", 
      page: 1, 
      pageSize: 100 
    }).pipe(
      takeUntil(this.destroy$),
      tap({
        next: (res: any) => this.addLog(`getProducts SUCCESS: ${res?.items?.length ?? 0} items`),
        error: (err: any) => this.addLog(`getProducts ERROR: ${JSON.stringify(err)}`)
      })
    );

    this.addLog("Combining API observables...");

    combineLatest([product$, config$, allProds$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([prod, config, allProds]: [any, any, any]) => {
          this.addLog("combineLatest complete next emission triggered");
          // Map AdminProduct (prod) to client Product (as needed)
          this.product = prod as any;
          this.config = config;
          this.allProducts = allProds.items as any[];
          
          // Setup initial related products from categories or groups
          this.defaultRelatedProducts = this.allProducts.filter(p => p.id !== productId && p.categoryId === prod.categoryId);

          if (prod.slug) {
            // Construct the public preview URL passing a special query param
            const rawUrl = `/clp/${prod.slug}?preview=true`;
            this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
          }

          if (config) {
            this.configForm.patchValue({
              ...config,
              featuredProductName: config.featuredProductName || prod.name,
              promoPrice: config.promoPrice || prod.price,
              originalPrice: config.originalPrice || prod.compareAtPrice || prod.price
            });

            if (config.sectionsJson) {
              try {
                this.sections = JSON.parse(config.sectionsJson);

                // Migration: remove legacy types
                this.sections = this.sections.filter(s => s.type !== 'product-details' && s.type !== 'ad-banners');

                // Migration: ensure marquee is always first and visible
                const marquee = this.sections.find(s => s.type === 'marquee');
                if (marquee) {
                  marquee.visible = true;
                  this.sections = this.sections.filter(s => s.type !== 'marquee');
                  this.sections.unshift(marquee);
                } else {
                  this.sections.unshift({
                    id: 'marquee', type: 'marquee', label: '💬 Marquee Bar', visible: true,
                    settings: { marqueeText: '🔥 সীমিত স্টক — মাত্র ৩৪টি বাকি! 🚚 সারা বাংলাদেশে ফ্রি ডেলিভারি 💥' }
                  });
                }

                // Ensure all sections have required fields
                this.sections.forEach(s => {
                  if (!s.label) s.label = s.type;
                  if (s.visible === undefined) s.visible = true;
                });
              } catch (e) {
                console.error("Invalid sections JSON", e);
              }
            }
          } else {
            // Reset default featured pricing fields if config doesn't exist
            this.configForm.patchValue({
            featuredProductName: prod.name,
            promoPrice: prod.price,
            originalPrice: prod.compareAtPrice || prod.price
          });
        }

        this.isLoading = false;
        this.refreshRelatedProducts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.addLog(`combineLatest ERROR: ${JSON.stringify(err)}`);
        this.cdr.detectChanges();
        console.error("Failed to load page config data", err);
        this.notification.error("Error loading product landing page configuration.");
        void this.router.navigate(["/admin/products"]);
      }
    });
  }

  onSectionsChanged(updatedSections: LandingSection[]): void {
    this.sections = updatedSections;
    this.sendConfigToPreview();
  }

  toggleProductSelection(productId: number): void {
    const section = this.sections.find(s => s.type === "product-select");
    if (!section) return;

    if (!section.settings) section.settings = {};
    if (!section.settings.customProductIds) section.settings.customProductIds = [];

    const index = section.settings.customProductIds.indexOf(productId);
    if (index > -1) {
      section.settings.customProductIds.splice(index, 1);
    } else {
      section.settings.customProductIds.push(productId);
    }

    this.refreshRelatedProducts();
    this.sendConfigToPreview();
  }

  private refreshRelatedProducts(): void {
    const section = this.sections.find(s => s.type === "product-select");
    const customIds = section?.settings?.customProductIds as number[] | undefined;

    if (customIds && customIds.length > 0) {
      this.isProductSelectionLoading = true;
      // Load selected related products
      this.productsService.getProducts({ searchTerm: "", category: "", subCategory: "", statusTab: "All Items", page: 1, pageSize: 100 }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.isProductSelectionLoading = false;
        },
        error: () => {
          this.isProductSelectionLoading = false;
        }
      });
    }
  }

  setPreviewDevice(device: "desktop" | "tablet" | "mobile"): void {
    this.previewDevice = device;
  }

  sendConfigToPreview(): void {
    const iframe = this.previewIframe?.nativeElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "CLP_PREVIEW_UPDATE",
        sections: this.sections,
        config: this.configForm.value
      }, "*");
    }
  }

  onIframeLoad(): void {
    // Send initial configuration payload as soon as the iframe loads
    this.sendConfigToPreview();
  }

  syncSectionSettingsToForm(): void {
    // 1. Countdown Section
    const countdown = this.sections.find(s => s.type === 'countdown');
    if (countdown && countdown.settings) {
      this.configForm.patchValue({
        relativeTimerTotalMinutes: countdown.settings.relativeTimerTotalMinutes,
        isTimerVisible: countdown.settings.isTimerVisible ?? true,
        headerTitle: countdown.settings.headerTitle || ''
      });
    }

    // 2. Trust Banner Section
    const trust = this.sections.find(s => s.type === 'trust-banner');
    if (trust && trust.settings) {
      this.configForm.patchValue({
        isTrustBannerVisible: trust.settings.isTrustBannerVisible ?? true,
        trustBannerText: trust.settings.trustBannerText || ''
      });
    }

    // 3. Reviews Section
    const reviews = this.sections.find(s => s.type === 'reviews');
    if (reviews && reviews.settings) {
      this.configForm.patchValue({
        isReviewsVisible: reviews.settings.isReviewsVisible ?? true
      });
    }
  }

  saveLayout(): void {
    if (!this.product) return;
    this.isSaving = true;

    this.syncSectionSettingsToForm();

    const formValue = this.configForm.getRawValue();
    const configPayload: CustomLandingPageConfig = {
      ...formValue,
      productId: this.product.id,
      sectionsJson: JSON.stringify(this.sections),
      relativeTimerTotalMinutes: formValue.relativeTimerTotalMinutes ?? undefined
    };

    this.customLandingPageService.saveConfig(configPayload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success("Landing page configuration saved successfully!");
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.notification.error("Failed to save configuration.");
        this.cdr.detectChanges();
      }
    });
  }

  sharePageLink(): void {
    if (this.product && typeof window !== "undefined") {
      const url = `${window.location.origin}/clp/${this.product.slug}`;
      navigator.clipboard.writeText(url).then(() => {
        this.notification.success("Public link copied to clipboard!");
      }).catch(() => {
        this.notification.error("Failed to copy link.");
      });
    }
  }
}
