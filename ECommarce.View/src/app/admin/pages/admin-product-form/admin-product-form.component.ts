import { CommonModule } from "@angular/common";
import { Component, OnDestroy, inject } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { switchMap } from "rxjs/operators";

import {
  ProductCreatePayload,
  AdminProduct,
} from "../../models/products.models";
import { ProductImage, ProductType } from "../../../core/models/product";
import { ProductsService } from "../../services/products.service";
import { CategoriesService } from "../../services/categories.service";
import {
  Category,
  SubCategory,
  Collection,
} from "../../models/categories.models";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  ChevronRight,
  Check,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Upload,
  PlayCircle,
  PlusCircle,
  Eye,
  ChevronDown
} from "lucide-angular";

interface MediaFormValue {
  id: string;
  url: string;
  label: string;
  alt: string;
  type: "image" | "video";
  isMain: boolean;
  source: "file" | "url";
  color?: string;
}

@Component({
  selector: "app-admin-product-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)'
  },
  templateUrl: "./admin-product-form.component.html",
})
export class AdminProductFormComponent implements OnDestroy {
  readonly icons = {
    ChevronRight,
    Check,
    Bold,
    Italic,
    Underline,
    List,
    Link,
    Upload,
    PlayCircle,
    PlusCircle,
    Eye,
    ChevronDown
  };
  private formBuilder = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public imageUrlService = inject(ImageUrlService);

  // Mode detection
  isEditMode = false;
  productId: number | null = null;
  pageTitle = "Create Product";

  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  collections: Collection[] = [];

  // Flattened for easy access if needed, but we used filtered lists
  filteredSubCategories: SubCategory[] = [];
  filteredCollections: Collection[] = [];

  // Predefined standard sizes
  readonly standardSizes = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "2XL",
    "3XL",
    "4XL",
    "5XL",
    "28",
    "30",
    "32",
    "34",
    "36",
    "38",
    "40",
    "42",
    "44",
    "46",
    "Free Size",
  ];
  dynamicSizes: string[] = [];
  allAvailableSizes: string[] = [...this.standardSizes];

  // No longer using complex ratings/meta objects in the new DTO

  mediaError = "";
  private mediaFileMap = new Map<string, File>();

  openSizeDropdownIndex: number | null = null;

  form = this.formBuilder.group(
    {
      name: ["", [Validators.required, Validators.minLength(3)]],
      description: ["", [Validators.required]],
      shortDescription: [""],
      statusActive: [true],
      category: ["", [Validators.required]],
      subCategory: [""],
      collection: [""],
      gender: ["women"],
      price: [0, [Validators.required, Validators.min(0)]],
      salePrice: [null as number | null, [Validators.min(0)]],
      purchaseRate: [0],

      newArrival: [false],
      isFeatured: [false],

      tier: [""],
      tags: [""],
      sortOrder: [0, [Validators.min(0)]],
      mediaFiles: [[] as File[]],
      mediaItems: this.formBuilder.array([]),
      variants: this.formBuilder.group({
        colors: this.formBuilder.array([this.createColorGroup(true)]),
        sizes: this.formBuilder.array([this.createSizeGroup(true)]),
      }),
      meta: this.formBuilder.group({
        fabricAndCare: [""],
        shippingAndReturns: [""],
      }),
      productType: [ProductType.Simple],
      bundleItems: this.formBuilder.array([]),
      isBundle: [false],
      bundleQuantity: [1, [Validators.min(1)]],
    },
    { validators: [this.salePriceValidator] },
  );

  allProducts: AdminProduct[] = []; // To select components for combo
  ProductType = ProductType; // For template access

  constructor() {
    this.loadCategories(); // Load categories first

    // Detect edit mode from route params
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      if (id) {
        const parsedId = Number(id);
        if (Number.isFinite(parsedId)) {
          this.isEditMode = true;
          this.productId = parsedId;
          this.pageTitle = "Edit Product";
          // We call loadProduct inside loadCategories subscription or after
          // But since loadCategories is async, we might race.
          // However, patchValue works even if options aren't rendered yet (model value is set).
          // But filtering needs data.
        }
      }
    });

    // Setup cascading listeners
    this.setupCascadingSelects();
  }

  loadCategories(): void {
    this.categoriesService.getAll().subscribe((categories) => {
      this.categories = categories;

      // If edit mode, we might need to trigger filtering after data load if product loaded first
      if (this.isEditMode && this.productId) {
        this.loadProduct(this.productId);
      }
      // Also load all products for combo selection
      this.loadAllProducts();
      // Load available sizes for datalist
      this.loadAvailableSizes();
    });
  }

  loadAvailableSizes(): void {
    this.productsService.getAvailableSizes().subscribe({
      next: (sizes) => {
        this.dynamicSizes = sizes;
        const combined = new Set([...this.standardSizes, ...this.dynamicSizes]);
        this.allAvailableSizes = Array.from(combined).sort();
      },
      error: (err) => console.error("Error loading available sizes:", err),
    });
  }

  loadAllProducts(): void {
    this.productsService
      .getProducts({
        pageSize: 1000,
        page: 1,
        searchTerm: "",
        category: "",
        statusTab: "all",
      })
      .subscribe((res) => {
        this.allProducts = res.items;
      });
  }

  setupCascadingSelects(): void {
    this.form.get("category")?.valueChanges.subscribe((categoryId) => {
      if (!categoryId) {
        this.filteredSubCategories = [];
        this.filteredCollections = [];
        this.form.patchValue(
          { subCategory: "", collection: "" },
          { emitEvent: false },
        );
        return;
      }

      // Find selected category
      const category = this.categories.find(
        (c) => String(c.id) === String(categoryId),
      );
      this.filteredSubCategories = category?.subCategories || [];

      // Clear downstream if user manually changed it (not programmatic patch)
      // We can distinguish via options or just always clear if value doesn't match?
      // For now, simpler: if the current subCategory value is not in the new list, clear it.
      const currentSubId = this.form.get("subCategory")?.value;
      const exists = this.filteredSubCategories.find(
        (sc) => String(sc.id) === String(currentSubId),
      );
      if (!exists) {
        this.form.patchValue(
          { subCategory: "", collection: "" },
          { emitEvent: false },
        );
        this.filteredCollections = [];
      }
    });

    this.form.get("subCategory")?.valueChanges.subscribe((subCategoryId) => {
      if (!subCategoryId) {
        this.filteredCollections = [];
        this.form.patchValue({ collection: "" }, { emitEvent: false });
        return;
      }

      const subCategory = this.filteredSubCategories.find(
        (sc) => String(sc.id) === String(subCategoryId),
      );
      this.filteredCollections = subCategory?.collections || [];

      const currentColId = this.form.get("collection")?.value;
      const exists = this.filteredCollections.find(
        (c) => String(c.id) === String(currentColId),
      );
      if (!exists) {
        this.form.patchValue({ collection: "" }, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.mediaItemsArray.controls.forEach((control) => {
      const value = control.value as MediaFormValue;
      if (value.source === "file") {
        URL.revokeObjectURL(value.url);
      }
    });
    this.mediaFileMap.clear();
  }

  get mediaItemsArray(): FormArray {
    return this.form.get("mediaItems") as FormArray;
  }

  get colorsArray(): FormArray {
    return this.form.get("variants.colors") as FormArray;
  }

  get sizesArray(): FormArray {
    return this.form.get("variants.sizes") as FormArray;
  }

  get bundleItemsArray(): FormArray {
    return this.form.get("bundleItems") as FormArray;
  }

  addBundleItem(): void {
    const group = this.formBuilder.group({
      componentProductId: ["", Validators.required],
      componentVariantId: [null],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
    this.bundleItemsArray.push(group);
  }

  removeBundleItem(index: number): void {
    this.bundleItemsArray.removeAt(index);
  }

  getComponentVariants(productId: any): any[] {
    const product = this.allProducts.find(
      (p) => String(p.id) === String(productId),
    );
    return product?.variants || [];
  }

  loadProduct(productId: number): void {
    this.productsService
      .getProductById(productId)
      .subscribe((product: AdminProduct) => {
        console.log("Admin Product Edit - Full Product Response:", product);

        // Populate form with product data
        // Pre-fill filtered lists based on product data BEFORE patching
        if (product.categoryId) {
          const category = this.categories.find(
            (c) => String(c.id) === String(product.categoryId),
          );
          this.filteredSubCategories = category?.subCategories || [];
        }
        if (product.subCategoryId) {
          const subCategory = this.filteredSubCategories.find(
            (sc) => String(sc.id) === String(product.subCategoryId),
          );
          this.filteredCollections = subCategory?.collections || [];
        }

        this.form.patchValue({
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription || "",
          statusActive: product.isActive,
          category: String(product.categoryId),
          subCategory: product.subCategoryId
            ? String(product.subCategoryId)
            : "",
          collection: product.collectionId ? String(product.collectionId) : "",
          gender: "women", 
          price: product.compareAtPrice ?? product.price,
          salePrice: product.compareAtPrice ? product.price : null,
          purchaseRate: product.purchaseRate || product.price,

          newArrival: product.isNew || false,
          isFeatured: product.isFeatured || false,

          tier: (product as any).tier || "",
          tags: (product as any).tags || "",
          sortOrder: product.sortOrder,
          productType: product.productType,
          isBundle: product.isBundle,
          bundleQuantity: product.bundleQuantity || 1,
        });

        // Load bundle items if any
        this.bundleItemsArray.clear();
        if (product.bundleItems && product.bundleItems.length > 0) {
          product.bundleItems.forEach((item) => {
            this.bundleItemsArray.push(
              this.formBuilder.group({
                componentProductId: [
                  item.componentProductId,
                  Validators.required,
                ],
                componentVariantId: [item.componentVariantId],
                quantity: [
                  item.quantity,
                  [Validators.required, Validators.min(1)],
                ],
              }),
            );
          });
        }

        // Load existing media
        // 1. Parse Variants First (Colors needed for Media Dropdowns)
        this.colorsArray.clear();
        const uniqueColors = new Set<string>();
        const images = (product as any).images || (product as any).Images || [];

        images.forEach((img: any) => {
          const color = img.color || img.Color;
          if (color) uniqueColors.add(color);
        });

        if (uniqueColors.size > 0) {
          uniqueColors.forEach((color) => {
            this.colorsArray.push(
              this.formBuilder.group({
                name: [color],
                selected: [true],
              }),
            );
          });
        } else {
          this.colorsArray.push(this.createColorGroup(true));
        }

        // 2. Sizes from Variants
        this.sizesArray.clear();
        const variants =
          (product as any).variants || (product as any).Variants || [];

        if (variants && variants.length > 0) {
          variants.forEach((v: any) => {
            this.sizesArray.push(
              this.formBuilder.group({
                label: [v.size ?? v.Size ?? ""],
                price: [
                  v.compareAtPrice ?? v.price ?? v.Price ?? product.compareAtPrice ?? product.price ?? 0,
                  [Validators.required, Validators.min(0)],
                ],
                salePrice: [
                  v.compareAtPrice ? (v.price ?? v.Price ?? product.price ?? 0) : null,
                  [Validators.min(0)],
                ],
                purchaseRate: [
                  v.purchaseRate ?? v.PurchaseRate ?? product.purchaseRate ?? product.price ?? 0,
                  [Validators.required, Validators.min(0)],
                ],
                stock: [
                  v.stockQuantity ?? v.StockQuantity ?? 0,
                  [Validators.min(0)],
                ],
                selected: [true],
              }),
            );
          });
        } else {
          this.sizesArray.push(this.createSizeGroup(true));
        }

        // 3. Load Media
        // Load existing media with details
        if ((product as any).images && (product as any).images.length > 0) {
          (product as any).images.forEach((img: any, index: number) => {
            this.addMediaItem({
              url: img.imageUrl,
              source: "url",
              label: `Image ${index + 1}`,
              alt: img.altText || product.name,
              type: "image",
              isMain: img.isPrimary,
              color: img.color, // Now we have color!
            });
          });
        } else if (product.images && product.images.length > 0) {
          // Fallback for legacy (if any) or if typed as ProductImage[]
          product.images.forEach((img, index) => {
            this.addMediaItem({
              url: img.imageUrl,
              source: "url",
              label: `Image ${index + 1}`,
              alt: img.altText || product.name,
              type: "image",
              isMain: img.isPrimary,
              color: img.color,
            });
          });
        } else if (product.imageUrl) {
          this.addMediaItem({
            url: product.imageUrl,
            source: "url",
            label: "Main Image",
            alt: product.name || "Product image",
            type: "image",
            isMain: true,
          });
        }

        // Load colors (from Images or previously saved structure if we supported it)
        // In new backend: Colors come from Images metadata or we can infer them?
        // Actually, the new backend 'GetProductById' returns 'Variants.Colors' as a list of names!
        // We should use that.

        // We removed the legacy 'else if' block because 'backendVariants' in GetProductById
        // is now ALWAYS an object (ProductVariantsDto), never an array of entities.

        // Load meta
        this.form.patchValue({
          meta: {
            fabricAndCare:
              product.fabricAndCare ||
              (product as any).meta?.fabricAndCare ||
              "",
            shippingAndReturns:
              product.shippingAndReturns ||
              (product as any).meta?.shippingAndReturns ||
              "",
          },
        });
      });
  }

  addColor(): void {
    this.colorsArray.push(this.createColorGroup(false));
  }

  removeColor(index: number): void {
    if (this.colorsArray.length <= 1) {
      return;
    }
    const wasSelected = Boolean(
      this.colorsArray.at(index)?.get("selected")?.value,
    );
    this.colorsArray.removeAt(index);
    if (wasSelected) {
      this.ensureSingleSelected(this.colorsArray, "selected");
    }
  }

  setSelectedColor(index: number): void {
    this.ensureSingleSelected(this.colorsArray, "selected", index);
  }

  addSize(): void {
    this.sizesArray.push(this.createSizeGroup(false));
  }

  removeSize(index: number): void {
    if (this.sizesArray.length <= 1) {
      return;
    }
    const wasSelected = Boolean(
      this.sizesArray.at(index)?.get("selected")?.value,
    );
    this.sizesArray.removeAt(index);
    if (wasSelected) {
      this.ensureSingleSelected(this.sizesArray, "selected");
    }
  }

  setSelectedSize(index: number): void {
    this.ensureSingleSelected(this.sizesArray, "selected", index);
  }

  handleFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.addFiles(Array.from(input.files));
    input.value = "";
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer?.files?.length) {
      return;
    }
    this.addFiles(Array.from(event.dataTransfer.files));
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  addFromUrl(): void {
    const url = window.prompt("Enter media URL");
    if (!url) {
      return;
    }
    this.addMediaItem({
      url,
      source: "url",
    });
  }

  removeMediaItem(index: number): void {
    const control = this.mediaItemsArray.at(index);
    if (!control) {
      return;
    }
    const value = control.value as MediaFormValue;
    if (value.source === "file") {
      URL.revokeObjectURL(value.url);
      this.mediaFileMap.delete(value.id);
    }
    this.mediaItemsArray.removeAt(index);
    this.ensureMainMedia();
    this.syncMediaFiles();
  }

  setMainMedia(index: number): void {
    this.ensureSingleSelected(this.mediaItemsArray, "isMain", index);
  }

  discard(): void {
    const confirmed = window.confirm("Discard changes?");
    if (!confirmed) {
      return;
    }
    this.resetForm();
    void this.router.navigate(["/admin/products"]);
  }

  applyFormatting(type: string, textarea: HTMLTextAreaElement): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const fullText = textarea.value;

    let replacement = "";
    switch (type) {
      case "bold":
        replacement = `<b>${selectedText}</b>`;
        break;
      case "italic":
        replacement = `<i>${selectedText}</i>`;
        break;
      case "underline":
        replacement = `<u>${selectedText}</u>`;
        break;
      case "list":
        replacement = `\n<ul>\n  <li>${selectedText || "Item"}</li>\n</ul>`;
        break;
      case "link":
        const url = window.prompt("Enter URL", "https://");
        if (url) {
          replacement = `<a href="${url}" class="text-primary hover:underline" target="_blank">${selectedText || "Link Text"}</a>`;
        } else {
          return;
        }
        break;
    }

    const newValue =
      fullText.substring(0, start) + replacement + fullText.substring(end);
    this.form.patchValue({ description: newValue });

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 0);
  }

  onSizeSelectChange(event: Event, index: number): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const sizeForm = this.sizesArray.at(index);

    if (value === "custom") {
      sizeForm.patchValue({ label: "custom" });
    } else {
      sizeForm.patchValue({ label: value });
    }
  }

  toggleSizeDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.openSizeDropdownIndex = this.openSizeDropdownIndex === index ? null : index;
  }

  selectSize(index: number, sizeValue: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const sizeForm = this.sizesArray.at(index);
    sizeForm.patchValue({ label: sizeValue });
    this.openSizeDropdownIndex = null;
  }

  onDocumentClick(event: MouseEvent): void {
    // If click happens outside the dropdown (or we just close it on any document click since toggle stops propagation)
    this.openSizeDropdownIndex = null;
  }

  saveProduct(): void {
    console.log("=== Save Product Started ===");
    this.mediaError = "";

    if (this.mediaItemsArray.length === 0) {
      this.mediaError = "Add at least one image or video for the product.";
      console.error("Validation failed: No media items");
    }

    if (this.form.invalid || this.mediaItemsArray.length === 0) {
      this.form.markAllAsTouched();

      // Log detailed validation errors
      const errorMessages: string[] = [];
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control?.invalid) {
          if (control.errors?.['required']) errorMessages.push(`${key} is required`);
          else if (control.errors?.['min']) errorMessages.push(`${key} must be positive`);
          else errorMessages.push(`${key} is invalid`);
        }
      });
      if (this.form.errors?.['salePriceExceedsBase']) {
        errorMessages.push("Sale Price must be lower than Price");
      }

      window.alert(
        `Form has errors:\n${errorMessages.join("\n")}`
      );
      return;
    }

    const files = this.getSelectedFiles();
    console.log("Files to upload:", files.length);

    this.productsService
      .uploadProductMedia(files)
      .pipe(
        switchMap((mediaUrls) => {
          console.log("Media uploaded successfully:", mediaUrls);
          const payload = this.buildPayload(mediaUrls);

          // Use update or create based on mode
          if (this.isEditMode && this.productId !== null) {
            console.log("Updating product with payload:", payload);
            return this.productsService.updateProduct(
              this.productId,
              payload as any,
            );
          } else {
            console.log("Creating product with payload:", payload);
            return this.productsService.createProduct(payload);
          }
        }),
      )
      .subscribe({
        next: (product) => {
          const action = this.isEditMode ? "updated" : "created";
          console.log(`Product ${action} successfully:`, product);
          window.alert(`Product ${action} successfully.`);
          void this.router.navigate(["/admin/products"]);
        },
        error: (error) => {
          const action = this.isEditMode ? "update" : "create";
          console.error(`Error ${action}ing product:`, error);
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            `Failed to ${action} product. Please try again.`;
          window.alert(`Error: ${errorMessage}`);
        },
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private createColorGroup(selected: boolean): AbstractControl {
    return this.formBuilder.group({
      name: [""],
      selected: [selected],
    });
  }

  private createSizeGroup(selected: boolean): AbstractControl {
    return this.formBuilder.group({
      label: [""],
      price: [0, [Validators.required, Validators.min(0)]],
      salePrice: [null as number | null, [Validators.min(0)]],
      purchaseRate: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.min(0)]],
      selected: [selected],
    });
  }

  private createMediaItemGroup(item: MediaFormValue): AbstractControl {
    return this.formBuilder.group({
      id: [item.id],
      url: [item.url],
      label: [item.label],
      alt: [item.alt],
      type: [item.type],
      isMain: [item.isMain],
      source: [item.source],
      color: [item.color],
    });
  }

  private salePriceValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const basePrice = Number(control.get("price")?.value ?? 0);
    const salePriceControl = control.get("salePrice");
    const salePrice = salePriceControl?.value;
    if (salePrice === null || salePrice === undefined) {
      return null;
    }
    const saleValue = Number(salePrice);
    if (Number.isNaN(saleValue)) {
      return null;
    }
    return saleValue > basePrice ? { salePriceExceedsBase: true } : null;
  }

  private addFiles(files: File[]): void {
    files.forEach((file) => {
      const id = this.generateId("media");
      const url = URL.createObjectURL(file);
      this.mediaFileMap.set(id, file);
      this.addMediaItem({
        id,
        url,
        label:
          this.titleize(file.name.replace(/\.[^.]+$/, "")) || "Gallery image",
        alt: this.form.get("name")?.value || "Product image",
        type: "image",
        isMain: this.mediaItemsArray.length === 0,
        source: "file",
      });
    });
  }

  private addMediaItem(
    partial: Partial<MediaFormValue> & Pick<MediaFormValue, "url" | "source">,
  ): void {
    const item: MediaFormValue = {
      id: partial.id ?? this.generateId("media"),
      url: partial.url,
      label: partial.label ?? "Gallery image",
      alt: partial.alt ?? this.form.get("name")?.value ?? "Product image",
      type: partial.type ?? "image",
      isMain: partial.isMain ?? this.mediaItemsArray.length === 0,
      source: partial.source,
      color: partial.color,
    };
    this.mediaItemsArray.push(this.createMediaItemGroup(item));
    this.mediaError = "";
    this.ensureMainMedia();
    this.syncMediaFiles();
  }

  private ensureMainMedia(): void {
    const hasMain = this.mediaItemsArray.controls.some(
      (control) => control.get("isMain")?.value,
    );
    if (!hasMain && this.mediaItemsArray.length > 0) {
      this.mediaItemsArray.at(0)?.get("isMain")?.setValue(true);
    }
  }

  private ensureSingleSelected(
    array: FormArray,
    controlName: string,
    selectedIndex?: number,
  ): void {
    array.controls.forEach((control, index) => {
      control
        .get(controlName)
        ?.setValue(selectedIndex === index, { emitEvent: false });
    });
    if (selectedIndex === undefined && array.length > 0) {
      array.at(0)?.get(controlName)?.setValue(true, { emitEvent: false });
    }
  }

  private syncMediaFiles(): void {
    const files = this.getSelectedFiles();
    this.form.patchValue({ mediaFiles: files });
  }

  private getSelectedFiles(): File[] {
    return Array.from(this.mediaFileMap.values());
  }

  private buildPayload(uploadedUrls: string[]): ProductCreatePayload {
    const raw = this.form.getRawValue();

    // 1. Handle Media (Main + Thumbnails)
    const mediaItems = this.buildMediaItems(uploadedUrls);
    const mainImageItem = mediaItems.find((i) => i.isMain) || mediaItems[0];
    const thumbnailItems = mediaItems.filter((i) => i !== mainImageItem);

    const mainImage = {
      type: mainImageItem?.type || "image",
      label: mainImageItem?.label || "Main Image",
      imageUrl: mainImageItem?.url || "",
      alt: mainImageItem?.alt || "",
      color: mainImageItem?.color || "",
    };

    const thumbnails = thumbnailItems.map((item) => ({
      type: item.type,
      label: item.label,
      imageUrl: item.url,
      alt: item.alt,
      color: item.color || "",
    }));

    // 2. Handle Variants (Definitions)
    const rawColors = this.colorsArray.getRawValue();
    const rawSizes = this.sizesArray.getRawValue();

    const colors = rawColors.map((c: any) => ({
      name: c.name,
      hex: "", // Hex not currently in form, could add later
      selected: true,
    }));

    const sizes = rawSizes.map((s: any) => ({
      label: s.label,
      price: Number(s.price),
      salePrice:
        s.salePrice !== null && s.salePrice !== undefined
          ? Number(s.salePrice)
          : undefined,
      purchaseRate: Number(s.purchaseRate),
      stock: Number(s.stock),
      selected: true,
    }));

    // 3. Handle Inventory Variants (Specific SKUs)
    // NOW: Size-based only. No cross-multiplication with colors.
    const inventoryVariants: any[] = [];

    // We only care about sizes for stock. Colors are just tags.
    rawSizes.forEach((s: any) => {
      // If no size label, skip? Or allow empty size for "One Size"?
      // Let's assume label is required or defaults to "One Size" if empty?
      // For now, take label as is.
      const sizeLabel = s.label || "One Size";

      inventoryVariants.push({
        label: sizeLabel,
        price: Number(s.price || raw.price),
        salePrice:
          s.salePrice !== null && s.salePrice !== undefined
            ? Number(s.salePrice)
            : undefined,
        purchaseRate: Number(s.purchaseRate || raw.purchaseRate),
        sku: `${raw.name?.slice(0, 3)}-${sizeLabel}`
          .toUpperCase()
          .replace(/\s+/g, ""),
        inventory: Number(s.stock || 0),
        imageUrl: "",
      });
    });

    // 4. Resolve Category Name
    const categoryObj = this.categories.find(
      (c) => String(c.id) === String(raw.category),
    );

    // 5. Derive product-level price from first (default) size variant
    const firstSize = rawSizes[0];
    const productPrice = firstSize ? Number(firstSize.price || 0) : 0;
    const productSalePrice =
      firstSize?.salePrice !== null && firstSize?.salePrice !== undefined
        ? Number(firstSize.salePrice)
        : undefined;
    const productPurchaseRate = firstSize
      ? Number(firstSize.purchaseRate || 0)
      : 0;

    return {
      name: raw.name ?? "",
      description: raw.description ?? "",
      shortDescription: raw.shortDescription ?? "",
      statusActive: Boolean(raw.statusActive),
      category: categoryObj?.name || "", // Send Name, not ID
      gender: raw.gender ?? "women",
      price: productPrice,
      salePrice: productSalePrice,
      purchaseRate: productPurchaseRate,

      newArrival: Boolean(raw.newArrival),
      isFeatured: Boolean(raw.isFeatured),

      media: {
        mainImage,
        thumbnails,
      },

      variants: {
        colors,
        sizes,
      },

      inventoryVariants,

      meta: {
        fabricAndCare: raw.meta?.fabricAndCare ?? "",
        shippingAndReturns: raw.meta?.shippingAndReturns ?? "",
      },

      ratings: {
        average: 0,
        count: 0,
      },

      // Legacy/Extra fields for updated backend
      tier: raw.tier ?? "",
      tags: raw.tags ?? "",
      sortOrder: Number(raw.sortOrder ?? 0),
      subCategoryId: raw.subCategory ? Number(raw.subCategory) : null,
      collectionId: raw.collection ? Number(raw.collection) : null,
      productType: raw.productType as ProductType,
      bundleItems:
        raw.productType === ProductType.Combo
          ? (raw.bundleItems as any[]).map((bi) => ({
              componentProductId: Number(bi.componentProductId),
              componentVariantId: bi.componentVariantId
                ? Number(bi.componentVariantId)
                : undefined,
              quantity: Number(bi.quantity),
            }))
          : [],
      isBundle: Boolean(raw.isBundle),
      bundleQuantity: Number(raw.bundleQuantity || 1),
    };
    // but we want to match backend DTO structure primarily.
    // Actually the interface is updated, so it should be fine.
    // Removing 'as any' if possible to verify type safety.
  }

  private buildMediaItems(uploadedUrls: string[]): MediaFormValue[] {
    let fileIndex = 0;
    return this.mediaItemsArray.controls.map((control) => {
      const value = control.getRawValue() as MediaFormValue;
      if (value.source === "file") {
        const url = uploadedUrls[fileIndex] ?? value.url;
        fileIndex += 1;
        return { ...value, url };
      }
      return value;
    });
  }

  private mapToProductImage(item: MediaFormValue): ProductImage {
    return {
      id: 0,
      imageUrl: item.url,
      altText: item.alt || "Product image",
      isPrimary: item.isMain,
      color: item.color,
    };
  }

  private resetForm(): void {
    this.form.reset({
      name: "",
      description: "",
      shortDescription: "",
      statusActive: true,
      category: "",
      subCategory: "",
      collection: "",
      gender: "women",
      price: 0,
      salePrice: null,
      purchaseRate: 0,

      newArrival: false,
      isFeatured: false,

      tier: "",
      tags: "",
      sortOrder: 0,
      mediaFiles: [],
      mediaItems: [],
      variants: {
        colors: [this.createColorGroup(true).value],
        sizes: [this.createSizeGroup(true).value],
      },
      meta: {
        fabricAndCare: "",
        shippingAndReturns: "",
      },
      productType: ProductType.Simple,
      isBundle: false,
      bundleQuantity: 1,
    });
    this.mediaError = "";

    this.mediaItemsArray.controls.forEach((control) => {
      if (control.get("source")?.value === "file") {
        URL.revokeObjectURL(control.get("url")?.value);
      }
    });
    this.mediaItemsArray.clear();
    this.mediaFileMap.clear();

    while (this.colorsArray.length > 1) {
      this.colorsArray.removeAt(0, { emitEvent: false });
    }
    this.colorsArray
      .at(0)
      ?.patchValue({ name: "", hex: "#111827", selected: true });

    while (this.sizesArray.length > 1) {
      this.sizesArray.removeAt(0, { emitEvent: false });
    }
    this.sizesArray.at(0)?.patchValue({ label: "", stock: 0, selected: true });
  }

  private titleize(value: string): string {
    return value
      .split(/[-_ ]+/)
      .map((segment) =>
        segment ? segment[0].toUpperCase() + segment.slice(1) : "",
      )
      .join(" ")
      .trim();
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
