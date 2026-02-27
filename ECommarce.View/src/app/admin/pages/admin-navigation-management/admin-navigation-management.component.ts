import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminNavigationMenu } from "../../models/navigation.models";
import { AdminNavigationService } from "../../services/admin-navigation.service";
import {
  LucideAngularModule,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Link,
  Type,
  ArrowUpDown,
  Check,
  Loader2,
  GripVertical,
} from "lucide-angular";

@Component({
  selector: "app-admin-navigation-management",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-navigation-management.component.html",
})
export class AdminNavigationManagementComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    Edit,
    Trash2,
    ChevronRight,
    ChevronDown,
    X,
    Link,
    Type,
    ArrowUpDown,
    Check,
    Loader2,
    GripVertical,
  };
  private navService = inject(AdminNavigationService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  menus: AdminNavigationMenu[] = [];
  flatMenus: AdminNavigationMenu[] = [];
  isModalOpen = false;
  isEditing = false;
  selectedMenuId: number | null = null;
  isSubmitting = false;

  menuForm = this.fb.group({
    name: ["", [Validators.required]],
    link: ["", [Validators.required]],
    parentMenuId: [null as number | null],
    displayOrder: [0, [Validators.required]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadMenus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMenus(): void {
    this.navService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((menus) => {
        this.menus = menus;
        this.flatMenus = this.flattenMenus(menus);
      });
  }

  flattenMenus(
    menus: AdminNavigationMenu[],
    list: AdminNavigationMenu[] = [],
  ): AdminNavigationMenu[] {
    menus.forEach((m) => {
      list.push(m);
      if (m.childMenus && m.childMenus.length > 0) {
        this.flattenMenus(m.childMenus, list);
      }
    });
    return list;
  }

  openAddModal(parentId: number | null = null): void {
    this.isEditing = false;
    this.selectedMenuId = null;
    this.menuForm.reset({
      name: "",
      link: "",
      parentMenuId: parentId,
      displayOrder: this.getNextDisplayOrder(parentId),
      isActive: true,
    });
    this.isModalOpen = true;
  }

  openEditModal(menu: AdminNavigationMenu): void {
    this.isEditing = true;
    this.selectedMenuId = menu.id;
    this.menuForm.patchValue({
      name: menu.name,
      link: menu.link,
      parentMenuId: menu.parentMenuId ?? null,
      displayOrder: menu.displayOrder,
      isActive: menu.isActive,
    });
    this.isModalOpen = true;
  }

  getNextDisplayOrder(parentId: number | null): number {
    const siblings =
      parentId === null
        ? this.menus
        : this.flatMenus.find((m) => m.id === parentId)?.childMenus || [];
    return siblings.length + 1;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.menuForm.invalid) {
      this.menuForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const menuData = this.menuForm.value as any;

    if (this.isEditing && this.selectedMenuId) {
      this.navService.update(this.selectedMenuId, menuData).subscribe({
        next: () => {
          this.loadMenus();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    } else {
      this.navService.create(menuData).subscribe({
        next: () => {
          this.loadMenus();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    }
  }

  deleteMenu(id: number): void {
    if (confirm("Are you sure? This will delete all sub-menus too.")) {
      this.navService.delete(id).subscribe(() => {
        this.loadMenus();
      });
    }
  }

  getMenuItems(): AdminNavigationMenu[] {
    // Return all menus EXCEPT the one being edited and its descendants to avoid cycles
    if (!this.isEditing || !this.selectedMenuId) {
      return this.flatMenus;
    }
    const excludedIds = new Set<number>();
    this.collectDescendantIds(this.selectedMenuId, excludedIds);
    excludedIds.add(this.selectedMenuId);
    return this.flatMenus.filter((m) => !excludedIds.has(m.id));
  }

  private collectDescendantIds(id: number, set: Set<number>): void {
    const menu = this.flatMenus.find((m) => m.id === id);
    if (menu && menu.childMenus) {
      menu.childMenus.forEach((c) => {
        set.add(c.id);
        this.collectDescendantIds(c.id, set);
      });
    }
  }
}
