import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import {
  Category,
  CategoryNode,
  ReorderPayload,
} from "../../models/categories.models";
import { CategoriesService } from "../../services/categories.service";
import { SubCategoriesService } from "../../services/sub-categories.service";
import { environment } from "../../../../environments/environment";
import {
  LucideAngularModule,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Save,
  X,
  Image,
  Folder,
  Tag,
  Link,
  Check,
  Upload,
  GripVertical,
  AlertCircle,
} from "lucide-angular";

interface ParentOption {
  id: string | null;
  label: string;
}

@Component({
  selector: "app-admin-sub-category-management",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-sub-category-management.component.html",
})
export class AdminSubCategoryManagementComponent implements OnInit, OnDestroy {
  readonly icons = {
    Search,
    Plus,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    Save,
    X,
    Image,
    Folder,
    Tag,
    Link,
    Check,
    Upload,
    GripVertical,
    AlertCircle,
  };
  private categoriesService = inject(CategoriesService);
  private subCategoriesService = inject(SubCategoriesService);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  categoriesFlat: Category[] = [];
  categoriesTree: CategoryNode[] = [];
  filteredTree: CategoryNode[] = [];
  selectedId: string | null = null;
  expandedSet = new Set<string>();
  mode: "create" | "edit" = "edit";
  originalSnapshot: Category | null = null;
  filterTerm = "";
  draggingId: string | null = null;
  previousSelectedId: string | null = null;
  slugManuallyEdited = false;
  private isSlugUpdating = false;
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploadingImage = false;

  filterControl = this.formBuilder.control("", { nonNullable: true });

  // Enforce parentId as required for Sub Categories
  categoryForm = this.formBuilder.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    slug: ["", [Validators.required]],
    parentId: [null as string | null, [Validators.required]],
    imageUrl: [""],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCategories();

    this.filterControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterTerm = value.trim().toLowerCase();
        this.applyFilter();
      });

    this.categoryForm
      .get("name")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!this.slugManuallyEdited) {
          this.updateSlugFromName(value ?? "");
        }
      });

    this.categoryForm
      .get("slug")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isSlugUpdating) {
          this.slugManuallyEdited = true;
        }
      });

    const initialId = this.route.snapshot.queryParamMap.get("category");
    if (initialId) {
      // Try to find if it's a sub category ID first, then category
      // Since we don't know the type from just ID, we might need to check both prefixes or just wait for load
      // For simplicity, we skip auto-select from URL unless we implement robust lookup
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startCreate(): void {
    this.previousSelectedId = this.selectedId;
    this.selectedId = null;
    this.mode = "create";
    this.originalSnapshot = null;
    this.slugManuallyEdited = false;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.reset({
      name: "",
      slug: "",
      parentId: null, // User must select a parent
      imageUrl: "",
      isActive: true,
    });
  }

  selectCategory(category: Category): void {
    this.selectedId = category.id;
    this.mode = "edit";
    this.originalSnapshot = { ...category };
    this.slugManuallyEdited = false;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.reset();
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      parentId: (category as any).parentId ?? null,
      imageUrl: category.imageUrl ?? "",
      isActive: category.isActive,
    });
  }

  selectCategoryById(categoryId: string): void {
    const category = this.categoriesFlat.find((item) => item.id === categoryId);
    if (category) {
      this.selectCategory(category);
    }
  }

  toggleExpanded(categoryId: string): void {
    if (this.expandedSet.has(categoryId)) {
      this.expandedSet.delete(categoryId);
    } else {
      this.expandedSet.add(categoryId);
    }
  }

  expandAll(): void {
    this.expandedSet = new Set(this.collectCategoryIds(this.categoriesTree));
  }

  collapseAll(): void {
    this.expandedSet.clear();
  }

  isExpanded(categoryId: string): boolean {
    return this.expandedSet.has(categoryId);
  }

  isSelected(categoryId: string): boolean {
    return this.selectedId === categoryId;
  }

  // --- Drag & Drop (Disabled for now or strictly for reordering within same parent) ---
  // Reordering SubCategories is supported by backend? backend SubCategory has DisplayOrder.
  // Reordering Root Categories is supported by backend.
  // Moving SubCategory to another Parent? Supported by Update.

  onDragStart(categoryId: string, event: DragEvent): void {
    this.draggingId = categoryId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", categoryId);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  onDrop(targetCategory: Category): void {
    // Basic implementation: prevent nesting into itself
    // And allow reordering only if we support it.
    // For now, let's just stick to rudimentary check
    if (!this.draggingId || this.draggingId === targetCategory.id) {
      return;
    }

    // Prevent dropping a Root into a Sub (Sub cannot have children)
    const isDraggingRoot = this.draggingId.startsWith("cat_");
    const isTargetRoot = targetCategory.id.startsWith("cat_");

    // Allow dragging Sub into Root (Re-parenting)
    // Allow dragging Sub into Sub (Re-ordering or Re-parenting to target's parent)

    // Implementation of complex DnD with mixed types is risky without more time.
    // I will disable DnD logic for mixed types for safety in this pass,
    // or just allow re-ordering SIBLINGS.

    // Simply return for now to avoid breaking things until logic is fully mapped
    return;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    // Upload Image First if needed
    if (this.selectedImageFile) {
      this.isUploadingImage = true;
      // Determine service based on context.
      // If creating, we are creating a SubCategory (implied by this page purpose).
      // If editing, check ID prefix.

      let uploadObs;
      if (this.mode === "create") {
        uploadObs = this.subCategoriesService.uploadImage(
          this.selectedImageFile,
        );
      } else {
        if (this.selectedId?.startsWith("sub_")) {
          uploadObs = this.subCategoriesService.uploadImage(
            this.selectedImageFile,
          );
        } else {
          uploadObs = this.categoriesService.uploadImage(
            this.selectedImageFile,
          );
        }
      }

      uploadObs.subscribe({
        next: (imageUrl) => {
          this.isUploadingImage = false;
          this.categoryForm.patchValue({ imageUrl });
          this.selectedImageFile = null;
          this.imagePreviewUrl = null;
          this.performSave();
        },
        error: (error) => {
          this.isUploadingImage = false;
          window.alert("Failed to upload image.");
          console.error("Image upload error:", error);
        },
      });
    } else {
      this.performSave();
    }
  }

  private performSave(): void {
    const formValue = this.categoryForm.getRawValue();
    const parentIdStr = formValue.parentId; // "cat_5"

    // If Mode Create: Always create Sub Category
    // (User should not create Root categories here, simpler UX)
    if (this.mode === "create") {
      if (!parentIdStr || !parentIdStr.startsWith("cat_")) {
        window.alert("Please select a valid Parent Category.");
        return;
      }

      const categoryId = parseInt(parentIdStr.replace("cat_", ""));
      const payload = {
        name: formValue.name ?? "",
        slug: formValue.slug ?? "",
        imageUrl: formValue.imageUrl ?? "",
        categoryId: categoryId,
        isActive: formValue.isActive ?? true,
        description: "",
      };

      this.subCategoriesService.create(payload as any).subscribe((created) => {
        this.loadCategories(); // Reload to refresh tree
        window.alert("Sub Category created successfully.");
        this.startCreate();
      });
      return;
    }

    // Mode Edit
    if (!this.selectedId) return;

    if (this.selectedId.startsWith("sub_")) {
      // Update SubCategory
      const id = parseInt(this.selectedId.replace("sub_", ""));
      const catId = parentIdStr ? parseInt(parentIdStr.replace("cat_", "")) : 0;

      const payload = {
        name: formValue.name ?? "",
        slug: formValue.slug ?? "",
        imageUrl: formValue.imageUrl ?? "",
        categoryId: catId,
        isActive: formValue.isActive ?? true,
      };

      this.subCategoriesService
        .update(id, payload as any)
        .subscribe((updated) => {
          this.loadCategories();
          window.alert("Sub Category updated.");
        });
    } else if (this.selectedId.startsWith("cat_")) {
      // Update Root Category
      const id = this.selectedId.replace("cat_", "");
      const payload: Partial<Category> = {
        name: formValue.name ?? "",
        slug: formValue.slug ?? "",
        imageUrl: formValue.imageUrl ?? "",
        isActive: formValue.isActive ?? true,
        // parentId is null for root
        parentId: null,
      };

      this.categoriesService.update(id, payload).subscribe((updated) => {
        this.loadCategories();
        window.alert("Category updated.");
      });
    }
  }

  cancelEdit(): void {
    if (this.mode === "create") {
      this.mode = "edit";
      if (this.previousSelectedId) {
        this.selectCategoryById(this.previousSelectedId);
      } else {
        this.startCreate(); // Reset form
      }
      return;
    }

    if (this.originalSnapshot) {
      this.selectCategory(this.originalSnapshot);
    }
  }

  deleteCategory(category: Category): void {
    const isSub = category.id.startsWith("sub_");

    if (!isSub) {
      // If deleting Root Category, warn if it has children
      const hasChildren = this.categoriesFlat.some(
        (c) => c.parentId === category.id,
      );
      if (hasChildren) {
        window.alert(
          "Cannot delete Category with Sub Categories. Please remove them first.",
        );
        return;
      }
    }

    if (!window.confirm(`Delete ${category.name}?`)) return;

    if (isSub) {
      const id = parseInt(category.id.replace("sub_", ""));
      this.subCategoriesService.delete(id).subscribe(() => {
        this.loadCategories();
        this.startCreate();
        window.alert("Sub Category deleted.");
      });
    } else {
      // Delete Root
      const id = category.id.replace("cat_", "");
      this.categoriesService.delete(id).subscribe(() => {
        this.loadCategories();
        this.startCreate();
        window.alert("Category deleted.");
      });
    }
  }

  // ... Helpers ...

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith("image/")) {
      window.alert("Please select a valid image file.");
      return;
    }
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  getParentOptions(): ParentOption[] {
    // Only Root Categories can be parents
    return this.categoriesFlat
      .filter((c) => c.id.startsWith("cat_"))
      .map((c) => ({
        id: c.id,
        label: c.name,
      }));
  }

  // --- Tree Building specific to our prefixes ---
  private loadCategories(): void {
    this.categoriesService.getAll().subscribe((categories) => {
      const displayList: Category[] = [];

      categories.forEach((cat) => {
        // Root
        const rootId = `cat_${cat.id}`;
        displayList.push({
          id: rootId,
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          imageUrl: cat.imageUrl,
          isActive: cat.isActive,
          productCount: cat.productCount,
          sortOrder: cat.sortOrder,
        });

        // Children (SubCategories)
        // Note: Category interface has subCategories optional property?
        // "subCategories" property comes from backend DTO, but interface might not have it defined strictly
        // We use 'any' cast or check if property exists if strict
        const subCats = (cat as any).subCategories || [];

        subCats.forEach((sub: any) => {
          displayList.push({
            id: `sub_${sub.id}`,
            name: sub.name,
            slug: sub.slug,
            parentId: rootId,
            imageUrl: sub.imageUrl,
            isActive: sub.isActive,
            productCount: 0, // Not available yet
            sortOrder: sub.displayOrder || 0,
          });
        });
      });

      this.categoriesFlat = displayList;
      this.rebuildTree();
      this.expandAll();

      // Retain selection if exists
      if (this.selectedId) {
        const found = this.categoriesFlat.find((c) => c.id === this.selectedId);
        if (found) {
          this.selectCategory(found);
        } else {
          this.startCreate();
        }
      } else {
        this.startCreate();
      }
    });
  }

  // Standard Tree Logic (same as before mostly)
  buildTree(categories: Category[]): CategoryNode[] {
    const grouped = new Map<string | null, Category[]>();
    categories.forEach((category) => {
      const key = category.parentId ?? null;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(category);
    });

    const buildNodes = (parentId: string | null): CategoryNode[] => {
      const items = grouped.get(parentId) ?? [];
      const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
      return sorted.map((category) => ({
        category,
        children: buildNodes(category.id),
      }));
    };

    return buildNodes(null);
  }

  private rebuildTree(): void {
    this.categoriesTree = this.buildTree(this.categoriesFlat);
    this.applyFilter();
  }

  private applyFilter(): void {
    const { nodes, expanded } = this.filterTree(
      this.categoriesTree,
      this.filterTerm,
    );
    this.filteredTree = nodes;
    if (this.filterTerm) {
      this.expandedSet = expanded;
    }
  }

  // Same helper methods
  filterTree(
    nodes: CategoryNode[],
    term: string,
  ): { nodes: CategoryNode[]; expanded: Set<string> } {
    if (!term) return { nodes, expanded: new Set() };
    const expanded = new Set<string>();
    const filterNodes = (
      items: CategoryNode[],
      ancestors: string[],
    ): CategoryNode[] => {
      return items
        .map((node) => {
          const matches =
            node.category.name.toLowerCase().includes(term) ||
            node.category.slug.toLowerCase().includes(term);
          const filteredChildren = filterNodes(node.children, [
            ...ancestors,
            node.category.id,
          ]);
          if (matches || filteredChildren.length > 0) {
            if (filteredChildren.length > 0) expanded.add(node.category.id);
            ancestors.forEach((ancestorId) => expanded.add(ancestorId));
            return { ...node, children: filteredChildren };
          }
          return null;
        })
        .filter((node): node is CategoryNode => node !== null);
    };
    return { nodes: filterNodes(nodes, []), expanded };
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  updateSlugFromName(value: string): void {
    this.isSlugUpdating = true;
    this.categoryForm
      .get("slug")
      ?.setValue(this.slugify(value), { emitEvent: false });
    this.isSlugUpdating = false;
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    const baseUrl = environment.apiBaseUrl.replace("/api", "");
    return `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl}`;
  }

  getPreviewUrl(): string {
    if (this.imagePreviewUrl) return this.imagePreviewUrl;
    const imageUrl = this.categoryForm.get("imageUrl")?.value;
    return this.getImageUrl(imageUrl);
  }

  get rootCount(): number {
    return this.categoriesTree.length;
  }

  private collectCategoryIds(nodes: CategoryNode[]): string[] {
    const ids: string[] = [];
    nodes.forEach((node) => {
      ids.push(node.category.id);
      if (node.children.length > 0)
        ids.push(...this.collectCategoryIds(node.children));
    });
    return ids;
  }
}
