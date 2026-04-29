import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { Category } from "../../models/categories.models";
import { CategoriesService } from "../../services/categories.service";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-admin-category-management",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
  ],
  templateUrl: "./admin-category-management.component.html",
})
export class AdminCategoryManagementComponent implements OnInit, OnDestroy {
  private categoriesService = inject(CategoriesService);
  private formBuilder = inject(FormBuilder);
  public readonly authService = inject(AuthService);
  private notification = inject(NotificationService);
  public readonly imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  allCategories: Category[] = [];
  filteredCategories: Category[] = [];
  
  selectedId: number | null = null;
  mode: "create" | "edit" = "create";
  filterTerm = "";
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploadingImage = false;
  isSaving = false;

  filterControl = new FormControl("", { nonNullable: true });

  categoryForm = this.formBuilder.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    slug: [""], 
    imageUrl: [""],
    metaTitle: [""],
    metaDescription: [""],
    isActive: [true],
    displayOrder: [0],
    parentId: [null as number | null]
  });

  ngOnInit(): void {
    this.loadData();

    this.filterControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterTerm = value.trim().toLowerCase();
        this.applyFilter();
      });

    this.categoryForm.get("name")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          const slug = this.slugify(value);
          this.categoryForm.patchValue({ slug }, { emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.allCategories = categories.sort((a, b) => a.displayOrder - b.displayOrder);
        this.applyFilter();
      },
      error: (err) => {
        this.notification.error("Failed to load categories.");
        console.error(err);
      }
    });
  }

  applyFilter(): void {
    if (!this.filterTerm) {
      this.filteredCategories = [...this.allCategories];
      return;
    }

    this.filteredCategories = this.allCategories.filter(c => 
      c.name.toLowerCase().includes(this.filterTerm) || 
      c.slug.toLowerCase().includes(this.filterTerm)
    );
  }

  startCreate(): void {
    this.selectedId = null;
    this.mode = "create";
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.reset({
      name: "",
      slug: "",
      imageUrl: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
      displayOrder: 0,
      parentId: null
    });
  }

  cancelEdit(): void {
    this.startCreate();
  }

  editCategory(cat: Category): void {
    this.selectedId = cat.id;
    this.mode = "edit";
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.patchValue({
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl ?? "",
      metaTitle: cat.metaTitle ?? "",
      metaDescription: cat.metaDescription ?? "",
      isActive: cat.isActive,
      displayOrder: cat.displayOrder || 0,
      parentId: cat.parentId ?? null
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.notification.warn("Please fill all required fields.");
      return;
    }

    if (this.selectedImageFile) {
      this.isUploadingImage = true;
      this.categoriesService.uploadImage(this.selectedImageFile).subscribe({
        next: (res: any) => {
          this.isUploadingImage = false;
          const imageUrl = res.url || res;
          this.categoryForm.patchValue({ imageUrl });
          this.selectedImageFile = null;
          this.imagePreviewUrl = null;
          this.performSave();
        },
        error: () => {
          this.isUploadingImage = false;
          this.notification.error("Failed to upload image.");
        },
      });
    } else {
      this.performSave();
    }
  }

  private performSave(): void {
    const payload = this.categoryForm.getRawValue() as Partial<Category>;
    
    if (!payload.slug && payload.name) {
      payload.slug = this.slugify(payload.name);
    }

    this.isSaving = true;

    if (this.mode === "create") {
      this.categoriesService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadData();
          this.notification.success("Category created successfully.");
          this.startCreate();
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error(`Failed to create category: ${err.error?.message || err.message}`);
        }
      });
    } else {
      if (!this.selectedId) return;
      this.categoriesService.update(this.selectedId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadData();
          this.notification.success("Category updated successfully.");
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error(`Failed to update category: ${err.error?.message || err.message}`);
        }
      });
    }
  }

  deleteCategory(cat: Category): void {
    if (!window.confirm(`Are you sure you want to delete "${cat.name}"?`)) return;

    this.categoriesService.delete(cat.id).subscribe({
      next: () => {
        this.loadData();
        this.notification.success("Category deleted successfully.");
        if (this.selectedId === cat.id) {
          this.startCreate();
        }
      },
      error: (err) => {
        this.notification.error(err.error?.message || "Failed to delete category.");
      }
    });
  }

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    return this.imageUrlService.getImageUrl(imageUrl);
  }

  getPreviewUrl(): string {
    if (this.imagePreviewUrl) return this.imagePreviewUrl;
    const imageUrl = this.categoryForm.get("imageUrl")?.value;
    return this.getImageUrl(imageUrl);
  }
}
