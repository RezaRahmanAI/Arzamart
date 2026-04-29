import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { Category, SubCategory } from "../../models/categories.models";
import { CategoriesService } from "../../services/categories.service";
import { SubCategoriesService } from "../../services/sub-categories.service";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { ImageUrlService } from "../../../core/services/image-url.service";

interface FlatSubCategory extends SubCategory {
  parentName: string;
}

@Component({
  selector: "app-admin-sub-category-management",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
  ],
  templateUrl: "./admin-sub-category-management.component.html",
})
export class AdminSubCategoryManagementComponent implements OnInit, OnDestroy {
  private categoriesService = inject(CategoriesService);
  private subCategoriesService = inject(SubCategoriesService);
  private formBuilder = inject(FormBuilder);
  public readonly authService = inject(AuthService);
  private notification = inject(NotificationService);
  public readonly imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  allSubCategories: FlatSubCategory[] = [];
  filteredSubCategories: FlatSubCategory[] = [];
  parentCategories: Category[] = [];
  
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
    slug: [""], // Auto-generated
    categoryId: [null as number | null, [Validators.required]],
    imageUrl: [""],
    isActive: [true],
    displayOrder: [0]
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
    // Get static parent categories
    this.categoriesService.getAll().subscribe((categories) => {
      this.parentCategories = categories;
      
      // Get all sub-categories from DB
      this.subCategoriesService.getAll().subscribe((subs) => {
        this.allSubCategories = subs.map(sub => {
          const parent = this.parentCategories.find(pc => pc.id === sub.categoryId);
          return {
            ...sub,
            parentName: parent?.name || "Unknown"
          };
        }).sort((a, b) => a.parentName.localeCompare(b.parentName) || a.name.localeCompare(b.name));
        
        this.applyFilter();
      });
    });
  }

  applyFilter(): void {
    if (!this.filterTerm) {
      this.filteredSubCategories = [...this.allSubCategories];
      return;
    }

    this.filteredSubCategories = this.allSubCategories.filter(sc => 
      sc.name.toLowerCase().includes(this.filterTerm) || 
      sc.parentName.toLowerCase().includes(this.filterTerm) ||
      sc.slug.toLowerCase().includes(this.filterTerm)
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
      categoryId: null,
      imageUrl: "",
      isActive: true,
      displayOrder: 0
    });
  }

  editSubCategory(sub: FlatSubCategory): void {
    this.selectedId = sub.id;
    this.mode = "edit";
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.patchValue({
      name: sub.name,
      slug: sub.slug,
      categoryId: sub.categoryId,
      imageUrl: sub.imageUrl ?? "",
      isActive: sub.isActive,
      displayOrder: sub.displayOrder || 0
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
      this.subCategoriesService.uploadImage(this.selectedImageFile).subscribe({
        next: (imageUrl) => {
          this.isUploadingImage = false;
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
    const payload = this.categoryForm.getRawValue() as Partial<SubCategory>;
    
    // Final slug safety check
    if (!payload.slug && payload.name) {
      payload.slug = this.slugify(payload.name);
    }

    this.isSaving = true;

    if (this.mode === "create") {
      this.subCategoriesService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadData();
          this.notification.success("Sub Category created successfully.");
          this.startCreate();
        },
        error: (err) => {
          this.isSaving = false;
          console.error("Create Error:", err);
          const detail = err.error?.errors ? JSON.stringify(err.error.errors) : (err.error?.message || err.message);
          this.notification.error(`Failed to create sub category: ${detail}`);
        }
      });
    } else {
      if (!this.selectedId) return;
      this.subCategoriesService.update(this.selectedId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadData();
          this.notification.success("Sub Category updated successfully.");
        },
        error: (err) => {
          this.isSaving = false;
          console.error("Update Error:", err);
          const detail = err.error?.errors ? JSON.stringify(err.error.errors) : (err.error?.message || err.message);
          this.notification.error(`Failed to update sub category: ${detail}`);
        }
      });
    }
  }

  deleteSubCategory(sub: FlatSubCategory): void {
    if (!window.confirm(`Are you sure you want to delete "${sub.name}"?`)) return;

    this.subCategoriesService.delete(sub.id).subscribe({
      next: () => {
        this.loadData();
        this.notification.success("Sub Category deleted successfully.");
        if (this.selectedId === sub.id) {
          this.startCreate();
        }
      },
      error: (err) => {
        this.notification.error("Failed to delete sub category.");
      }
    });
  }

  cancelEdit(): void {
    this.startCreate();
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
