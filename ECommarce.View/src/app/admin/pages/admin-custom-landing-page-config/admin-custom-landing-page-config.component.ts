import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { LucideAngularModule, ArrowLeft, Save, Loader2, Info } from "lucide-angular";
import { CustomLandingPageService, CustomLandingPageConfig } from "../../services/custom-landing-page.service";
import { ProductsService } from "../../services/products.service";
import { AdminProduct } from "../../models/products.models";

@Component({
  selector: "app-admin-custom-landing-page-config",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: "./admin-custom-landing-page-config.component.html",
})
export class AdminCustomLandingPageConfigComponent implements OnInit {
  readonly icons = { ArrowLeft, Save, Loader2, Info };
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly clpService = inject(CustomLandingPageService);
  private readonly productsService = inject(ProductsService);

  productId = 0;
  product: AdminProduct | null = null;
  isLoading = false;
  isSaving = false;
  successMessage = "";
  errorMessage = "";

  readonly configForm = this.fb.nonNullable.group({
    relativeTimerTotalMinutes: [null as number | null],
    isTimerVisible: [true],
    headerTitle: ["অফারটি শেষ হতে মাত্র কিছুক্ষণ বাকি আছে!"],
    isProductDetailsVisible: [true],
    productDetailsTitle: ["🔥 প্রোডাক্ট ডিটেইলস"],
    isFabricVisible: [true],
    isDesignVisible: [true],
    isTrustBannerVisible: [true],
    trustBannerText: ["দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই"],
    featuredProductName: ["The Signature Suit"],
    promoPrice: [0],
    originalPrice: [0],
  });

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get("id"));
    if (this.productId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.productsService.getProductById(this.productId).subscribe((product: AdminProduct) => {
      this.product = product;
      if (product) {
        this.configForm.patchValue({
          featuredProductName: product.name,
          promoPrice: product.price,
          originalPrice: product.compareAtPrice || product.price
        });
      }
    });

    this.clpService.getConfig(this.productId).subscribe({
      next: (config) => {
        if (config.id) {
          // Format date for input type="datetime-local" if needed, 
          // though we might just use a text input or a proper date picker later
          this.configForm.patchValue({
            ...config
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = "Failed to load configuration.";
      }
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) return;

    this.isSaving = true;
    this.successMessage = "";
    this.errorMessage = "";

    const formValue = this.configForm.getRawValue();
    const config: CustomLandingPageConfig = {
      ...formValue,
      productId: this.productId,
      relativeTimerTotalMinutes: formValue.relativeTimerTotalMinutes ?? undefined
    };

    this.clpService.saveConfig(config).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = "Configuration saved successfully!";
        setTimeout(() => (this.successMessage = ""), 3000);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = "Failed to save configuration.";
      }
    });
  }
}
