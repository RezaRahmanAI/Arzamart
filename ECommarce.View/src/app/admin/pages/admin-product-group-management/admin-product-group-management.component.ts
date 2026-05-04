import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject, ViewChild, ElementRef } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from "rxjs";

import { ProductGroup, ProductGroupsService } from "../../services/product-groups.service";
import { ProductService } from "../../../core/services/product.service";
import { Product } from "../../../core/models/product";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-admin-product-group-management",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
  ],
  templateUrl: "./admin-product-group-management.component.html",
})
export class AdminProductGroupManagementComponent implements OnInit, OnDestroy {
  private groupsService = inject(ProductGroupsService);
  private productService = inject(ProductService);
  private formBuilder = inject(FormBuilder);
  private notification = inject(NotificationService);
  public readonly imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  @ViewChild('productSearchInput') productSearchInput!: ElementRef<HTMLInputElement>;

  allGroups: ProductGroup[] = [];
  filteredGroups: ProductGroup[] = [];
  currentGroupProducts: Product[] = [];
  
  productSearchResults: Product[] = [];
  
  selectedId: number | null = null;
  mode: "create" | "edit" = "create";
  isSaving = false;

  filterControl = new FormControl("", { nonNullable: true });

  groupForm = this.formBuilder.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    description: [""]
  });

  ngOnInit(): void {
    this.loadGroups();

    this.filterControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((value) => {
        const term = value.trim().toLowerCase();
        this.filteredGroups = this.allGroups.filter(g => 
          g.name.toLowerCase().includes(term) || 
          (g.description && g.description.toLowerCase().includes(term))
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroups(): void {
    this.groupsService.getAll().subscribe({
      next: (groups) => {
        this.allGroups = groups;
        this.filteredGroups = [...groups];
      },
      error: (err) => {
        this.notification.error("Failed to load product groups.");
        console.error(err);
      }
    });
  }

  startCreate(): void {
    this.selectedId = null;
    this.mode = "create";
    this.currentGroupProducts = [];
    this.groupForm.reset({
      name: "",
      description: ""
    });
  }

  cancelEdit(): void {
    this.startCreate();
  }

  editGroup(group: ProductGroup): void {
    this.selectedId = group.id;
    this.mode = "edit";
    this.groupForm.patchValue({
      name: group.name,
      description: group.description ?? ""
    });
    this.loadGroupProducts(group.id);
  }

  loadGroupProducts(id: number): void {
    this.groupsService.getById(id).subscribe({
      next: (group) => {
        this.currentGroupProducts = group.products || [];
      },
      error: (err) => {
        this.notification.error("Failed to load group products.");
      }
    });
  }

  saveGroup(): void {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.notification.warn("Please provide a group name.");
      return;
    }

    const payload = this.groupForm.getRawValue();
    this.isSaving = true;

    if (this.mode === "create") {
      this.groupsService.create(payload as any).subscribe({
        next: (newGroup) => {
          this.isSaving = false;
          this.loadGroups();
          this.notification.success("Product group created.");
          this.editGroup(newGroup); // Switch to edit mode to add products
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error("Failed to create group.");
        }
      });
    } else {
      if (!this.selectedId) return;
      this.groupsService.update(this.selectedId, payload as any).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadGroups();
          this.notification.success("Group info updated.");
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error("Failed to update group.");
        }
      });
    }
  }

  deleteGroup(): void {
    if (!this.selectedId) return;
    if (!window.confirm("Are you sure? This will un-group all products in this group.")) return;

    this.groupsService.delete(this.selectedId).subscribe({
      next: () => {
        this.notification.success("Group deleted.");
        this.loadGroups();
        this.startCreate();
      },
      error: (err) => {
        this.notification.error("Failed to delete group.");
      }
    });
  }

  onSearchProduct(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (!term || term.length < 2) {
      this.productSearchResults = [];
      return;
    }

    this.productService.getProducts({ searchTerm: term, pageSize: 10 }).subscribe({
      next: (res) => {
        // Filter out products already in THIS group
        this.productSearchResults = res.data.filter(p => 
          !this.currentGroupProducts.some(cp => cp.id === p.id)
        );
      }
    });
  }

  addProductToGroup(product: Product): void {
    if (!this.selectedId) return;

    this.groupsService.addProductToGroup(this.selectedId, product.id).subscribe({
      next: () => {
        this.notification.success(`${product.name} added to group.`);
        this.loadGroupProducts(this.selectedId!);
        this.productSearchResults = [];
        this.productSearchInput.nativeElement.value = "";
      },
      error: (err) => {
        this.notification.error("Failed to add product to group.");
      }
    });
  }

  removeProductFromGroup(product: Product): void {
    if (!this.selectedId) return;

    this.groupsService.removeProductFromGroup(this.selectedId, product.id).subscribe({
      next: () => {
        this.notification.success("Product removed from group.");
        this.loadGroupProducts(this.selectedId!);
      },
      error: (err) => {
        this.notification.error("Failed to remove product.");
      }
    });
  }

  getImageUrl(url: string | null | undefined): string {
    return this.imageUrlService.getImageUrl(url);
  }
}
