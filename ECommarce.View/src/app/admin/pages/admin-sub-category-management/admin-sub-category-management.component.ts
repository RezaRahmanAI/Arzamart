import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import {
  Category,
  CategoryNode,
} from "../../models/categories.models";
import { CategoriesService } from "../../services/categories.service";
import { SubCategoriesService } from "../../services/sub-categories.service";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

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
    AppIconComponent,
  ],
  templateUrl: "./admin-sub-category-management.component.html",
})
export class AdminSubCategoryManagementComponent implements OnInit, OnDestroy {
  private categoriesService = inject(CategoriesService);
  private subCategoriesService = inject(SubCategoriesService);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);
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
    this.selectedId = category.id as unknown as string;
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
    const category = this.categoriesFlat.find((item) => (item.id as unknown as string) === categoryId);
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
    return;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      const invalidFields: string[] = [];
      Object.keys(this.categoryForm.controls).forEach((key) => {
        if (this.categoryForm.get(key)?.invalid) invalidFields.push(key);
      });
      window.alert(
        `Please fill in all required fields: ${invalidFields.join(", ")}`,
      );
      return;
    }

    if (this.selectedImageFile) {
      this.isUploadingImage = true;
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
        },
      });
    } else {
      this.performSave();
    }
  }

  private performSave(): void {
    const formValue = this.categoryForm.getRawValue();
    const parentIdStr = formValue.parentId;

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

      this.subCategoriesService.create(payload as any).subscribe(() => {
        this.loadCategories();
        window.alert("Sub Category created successfully.");
        this.startCreate();
      });
      return;
    }

    if (!this.selectedId) return;

    if (this.selectedId.startsWith("sub_")) {
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
        .subscribe(() => {
          this.loadCategories();
          window.alert("Sub Category updated.");
        });
    } else if (this.selectedId.startsWith("cat_")) {
      const id = parseInt(this.selectedId.replace("cat_", ""));
      const payload: Partial<Category> = {
        name: formValue.name ?? "",
        slug: formValue.slug ?? "",
        imageUrl: formValue.imageUrl ?? "",
        isActive: formValue.isActive ?? true,
        parentId: null,
      };

      this.categoriesService.update(id, payload).subscribe(() => {
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
        this.startCreate();
      }
      return;
    }

    if (this.originalSnapshot) {
      this.selectCategory(this.originalSnapshot);
    }
  }

  deleteCategory(category: Category): void {
    const isSub = (category.id as unknown as string).startsWith("sub_");

    if (!isSub) {
      const hasChildren = this.categoriesFlat.some(
        (c) => (c.parentId as unknown as string) === (category.id as unknown as string),
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
      const id = parseInt((category.id as unknown as string).replace("sub_", ""));
      this.subCategoriesService.delete(id).subscribe(() => {
        this.loadCategories();
        this.startCreate();
        window.alert("Sub Category deleted.");
      });
    } else {
      const id = parseInt((category.id as unknown as string).replace("cat_", ""));
      this.categoriesService.delete(id).subscribe(() => {
        this.loadCategories();
        this.startCreate();
        window.alert("Category deleted.");
      });
    }
  }

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
    return this.categoriesFlat
      .filter((c) => (c.id as unknown as string).startsWith("cat_"))
      .map((c) => ({
        id: c.id as any,
        label: c.name,
      }));
  }

  private loadCategories(): void {
    this.categoriesService.getAll().subscribe((categories) => {
      const displayList: Category[] = [];

      categories.forEach((cat) => {
        const rootId = `cat_${cat.id}`;
        displayList.push({
          id: rootId as any,
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          imageUrl: cat.imageUrl,
          isActive: cat.isActive,
          productCount: cat.productCount,
          sortOrder: cat.sortOrder,
        });

        const subCats = (cat as any).subCategories || [];

        subCats.forEach((sub: any) => {
          displayList.push({
            id: `sub_${sub.id}` as any,
            name: sub.name,
            slug: sub.slug,
            parentId: rootId as any,
            imageUrl: sub.imageUrl,
            isActive: sub.isActive,
            productCount: 0,
            sortOrder: sub.displayOrder || 0,
          });
        });
      });

      this.categoriesFlat = displayList;
      this.rebuildTree();
      this.expandAll();

      if (this.selectedId) {
        const found = this.categoriesFlat.find((c) => (c.id as unknown as string) === this.selectedId);
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

  buildTree(categories: Category[]): CategoryNode[] {
    const grouped = new Map<string | null, Category[]>();
    categories.forEach((category) => {
      const key = (category.parentId as unknown as string) ?? null;
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
        children: buildNodes(category.id as unknown as string),
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
          const nodeId = node.category.id as unknown as string;
          const filteredChildren = filterNodes(node.children, [
            ...ancestors,
            nodeId,
          ]);
          if (matches || filteredChildren.length > 0) {
            if (filteredChildren.length > 0) expanded.add(nodeId);
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
      ids.push(node.category.id as unknown as string);
      if (node.children.length > 0)
        ids.push(...this.collectCategoryIds(node.children));
    });
    return ids;
  }
}
