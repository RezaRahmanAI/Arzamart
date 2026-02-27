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
  selector: "app-admin-category-management",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-category-management.component.html",
})
export class AdminCategoryManagementComponent implements OnInit, OnDestroy {
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
  isLoading = false;

  filterControl = this.formBuilder.control("", { nonNullable: true });

  categoryForm = this.formBuilder.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    slug: ["", [Validators.required]],
    parentId: [null as string | null],
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
      this.selectCategoryById(initialId);
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
      parentId: null,
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
    this.categoryForm.reset({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? null,
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
    if (!this.draggingId || this.draggingId === targetCategory.id) {
      return;
    }
    const dragged = this.categoriesFlat.find(
      (item) => item.id === this.draggingId,
    );
    if (!dragged) {
      return;
    }
    if (this.isDescendant(dragged.id, targetCategory.id)) {
      window.alert("You cannot move a category into one of its descendants.");
      return;
    }

    const draggedParentId = dragged.parentId ?? null;
    const targetParentId = targetCategory.parentId ?? null;

    if (draggedParentId === targetParentId) {
      this.reorderWithinParent(dragged, targetCategory);
    } else {
      dragged.parentId = targetCategory.id;
      dragged.sortOrder =
        this.categoriesFlat.filter(
          (item) =>
            item.parentId === targetCategory.id && item.id !== dragged.id,
        ).length + 1;
      this.updateSortOrderForParent(targetCategory.id);
      this.updateSortOrderForParent(draggedParentId);
    }

    this.rebuildTree();
    const newParentPayload: ReorderPayload = {
      parentId: dragged.parentId ?? null,
      orderedIds: this.getSiblingIds(dragged.parentId ?? null),
    };
    this.categoriesService.reorder(newParentPayload).subscribe();
    if (draggedParentId !== (dragged.parentId ?? null)) {
      const oldParentPayload: ReorderPayload = {
        parentId: draggedParentId,
        orderedIds: this.getSiblingIds(draggedParentId),
      };
      this.categoriesService.reorder(oldParentPayload).subscribe();
    }
    this.draggingId = null;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    // If there's a selected image file, upload it first
    if (this.selectedImageFile) {
      this.isUploadingImage = true;
      this.categoriesService.uploadImage(this.selectedImageFile).subscribe({
        next: (imageUrl) => {
          this.isUploadingImage = false;
          // Update form with uploaded image URL
          this.categoryForm.patchValue({ imageUrl });
          // Clear preview state
          this.selectedImageFile = null;
          this.imagePreviewUrl = null;
          // Now save the category
          this.performSave();
        },
        error: (error) => {
          this.isUploadingImage = false;
          window.alert("Failed to upload image. Please try again.");
          console.error("Image upload error:", error);
        },
      });
    } else {
      // No new image, just save the category
      this.performSave();
    }
  }

  private performSave(): void {
    const formValue = this.categoryForm.getRawValue();
    const payload: Partial<Category> = {
      name: formValue.name ?? "",
      slug: formValue.slug ?? "",
      parentId: formValue.parentId ?? null,
      imageUrl: formValue.imageUrl ?? "",
      isActive: formValue.isActive ?? true,
    };

    if (this.mode === "create") {
      this.categoriesService.create(payload).subscribe((created) => {
        this.categoriesFlat.push(created);
        this.rebuildTree();
        this.selectCategory(created);
        window.alert("Category created successfully.");
      });
      return;
    }

    if (!this.selectedId) {
      return;
    }

    this.categoriesService
      .update(this.selectedId, payload)
      .subscribe((updated) => {
        const index = this.categoriesFlat.findIndex(
          (item) => item.id === updated.id,
        );
        if (index !== -1) {
          const existing = this.categoriesFlat[index];
          this.categoriesFlat[index] = {
            ...existing,
            ...updated,
            productCount: existing.productCount,
          };
          this.rebuildTree();
          this.selectCategory(this.categoriesFlat[index]);
          window.alert("Category updated successfully.");
        }
      });
  }

  cancelEdit(): void {
    if (this.mode === "create") {
      this.mode = "edit";
      if (this.previousSelectedId) {
        this.selectCategoryById(this.previousSelectedId);
      } else {
        this.categoryForm.reset({
          name: "",
          slug: "",
          parentId: null,
          imageUrl: "",
          isActive: true,
        });
      }
      return;
    }

    if (this.originalSnapshot) {
      this.selectCategory(this.originalSnapshot);
    }
  }

  deleteCategory(category: Category): void {
    const hasChildren = this.categoriesFlat.some(
      (item) => item.parentId === category.id,
    );
    if (hasChildren) {
      window.alert(
        "This category has child categories. Remove or reassign them before deleting.",
      );
      return;
    }
    const confirmed = window.confirm(`Delete ${category.name}?`);
    if (!confirmed) {
      return;
    }

    this.categoriesService.delete(category.id).subscribe((success) => {
      if (!success) {
        return;
      }
      this.categoriesFlat = this.categoriesFlat.filter(
        (item) => item.id !== category.id,
      );
      if (this.selectedId === category.id) {
        this.selectedId = null;
        this.mode = "create";
      }
      this.rebuildTree();
      window.alert("Category deleted.");
    });
  }

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      window.alert("Please select a valid image file.");
      return;
    }

    // Store the file for later upload
    this.selectedImageFile = file;

    // Create local preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  getParentOptions(): ParentOption[] {
    const excludedIds = new Set<string>();
    if (this.selectedId) {
      excludedIds.add(this.selectedId);
      this.collectDescendants(this.selectedId, excludedIds);
    }

    const options: ParentOption[] = [{ id: null, label: "None (Top Level)" }];
    const walk = (nodes: CategoryNode[], depth: number) => {
      nodes.forEach((node) => {
        if (!excludedIds.has(node.category.id)) {
          options.push({
            id: node.category.id,
            label: `${"— ".repeat(depth)}${node.category.name}`,
          });
        }
        if (node.children.length > 0) {
          walk(node.children, depth + 1);
        }
      });
    };
    walk(this.categoriesTree, 0);
    return options;
  }

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

  filterTree(
    nodes: CategoryNode[],
    term: string,
  ): { nodes: CategoryNode[]; expanded: Set<string> } {
    if (!term) {
      return { nodes, expanded: new Set() };
    }

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
            if (filteredChildren.length > 0) {
              expanded.add(node.category.id);
            }
            ancestors.forEach((ancestorId) => expanded.add(ancestorId));
            return {
              ...node,
              children: filteredChildren,
            };
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

  isDescendant(parentId: string, candidateId: string): boolean {
    let current = this.categoriesFlat.find((item) => item.id === candidateId);
    while (current && current.parentId) {
      if (current.parentId === parentId) {
        return true;
      }
      current = this.categoriesFlat.find(
        (item) => item.id === current?.parentId,
      );
    }
    return false;
  }

  get rootCount(): number {
    return this.categoriesTree.length;
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.categoriesFlat = categories;
        this.rebuildTree();
        if (!this.selectedId && categories.length > 0) {
          this.selectCategory(categories[0]);
        }
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  private rebuildTree(): void {
    this.categoriesTree = this.buildTree(this.categoriesFlat);
    if (this.expandedSet.size === 0) {
      this.expandedSet = new Set(
        this.categoriesTree.map((node) => node.category.id),
      );
    }
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

  private updateSlugFromName(value: string): void {
    const slug = this.slugify(value);
    this.isSlugUpdating = true;
    this.categoryForm.get("slug")?.setValue(slug, { emitEvent: false });
    this.isSlugUpdating = false;
  }

  private collectCategoryIds(nodes: CategoryNode[]): string[] {
    const ids: string[] = [];
    nodes.forEach((node) => {
      ids.push(node.category.id);
      if (node.children.length > 0) {
        ids.push(...this.collectCategoryIds(node.children));
      }
    });
    return ids;
  }

  private collectDescendants(categoryId: string, collector: Set<string>): void {
    this.categoriesFlat
      .filter((item) => item.parentId === categoryId)
      .forEach((child) => {
        collector.add(child.id);
        this.collectDescendants(child.id, collector);
      });
  }

  private reorderWithinParent(dragged: Category, target: Category): void {
    const parentId = dragged.parentId ?? null;
    const siblings = this.categoriesFlat
      .filter((item) => (item.parentId ?? null) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const draggedIndex = siblings.findIndex((item) => item.id === dragged.id);
    const targetIndex = siblings.findIndex((item) => item.id === target.id);
    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    siblings.splice(draggedIndex, 1);
    siblings.splice(targetIndex, 0, dragged);

    siblings.forEach((item, index) => {
      const categoryIndex = this.categoriesFlat.findIndex(
        (entry) => entry.id === item.id,
      );
      if (categoryIndex !== -1) {
        this.categoriesFlat[categoryIndex] = {
          ...this.categoriesFlat[categoryIndex],
          sortOrder: index + 1,
        };
      }
    });
  }

  private updateSortOrderForParent(parentId: string | null): void {
    const siblings = this.categoriesFlat
      .filter((item) => (item.parentId ?? null) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    siblings.forEach((item, index) => {
      item.sortOrder = index + 1;
    });
  }

  private getSiblingIds(parentId: string | null): string[] {
    return this.categoriesFlat
      .filter((item) => (item.parentId ?? null) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.id);
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return "";
    }
    // If it's already an absolute URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    // Convert relative URL to absolute URL using backend base URL
    const baseUrl = environment.apiBaseUrl.replace("/api", "");
    return `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl}`;
  }

  getPreviewUrl(): string {
    // If there's a local preview, use it
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }
    // Otherwise, use the existing image URL from the form
    const imageUrl = this.categoryForm.get("imageUrl")?.value;
    return this.getImageUrl(imageUrl);
  }
}
