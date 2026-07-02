import { CommonModule, DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { IncompleteOrderApiService } from "../../../core/services/incomplete-order-api.service";
import { SourceManagementService } from "../../../core/services/source-management.service";
import { NotificationService } from "../../../core/services/notification.service";
import { Order, OrderStatus } from "../../../core/models/order";
import { IncompleteOrderStats } from "../../../core/models/incomplete-order";
import { SourcePage } from "../../../core/models/order-source";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-admin-incomplete-orders",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    AppIconComponent,
  ],
  templateUrl: "./incomplete-orders.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncompleteOrdersComponent implements OnInit {
  private readonly apiService = inject(IncompleteOrderApiService);
  private readonly sourceService = inject(SourceManagementService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Lists and Data
  orders: Order[] = [];
  stats: IncompleteOrderStats = {
    todayIncompleteCount: 0,
    recoveredCount: 0,
    recoveryRate: 0,
    topLandingPage: "N/A",
  };
  sourcePages: SourcePage[] = [];

  // Search & Filtering Controls
  searchControl = new FormControl("", { nonNullable: true });
  statusFilter = "All"; // 'All', 'Incomplete', 'IncompleteContacted', 'IncompleteLost'
  dateRangeFilter = "Today"; // 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time', 'Custom'
  sourcePageFilter = ""; // Empty string for All, or sourcePageId
  customStartDate = "";
  customEndDate = "";

  // Pagination
  page = 1;
  pageSize = 10;
  totalResults = 0;
  isLoading = false;

  // Modals state
  isNotesModalOpen = false;
  selectedOrder: Order | null = null;
  newNoteContent = "";

  // Dropdown menus
  activeActionMenuId: number | null = null;

  constructor() {}

  ngOnInit(): void {
    this.loadSourcePages();
    this.setupSearchWatch();
    this.readQueryParams();
    this.loadAllData();
  }

  private readQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    if (params["status"]) this.statusFilter = params["status"];
    if (params["dateRange"]) this.dateRangeFilter = params["dateRange"];
    if (params["sourcePageId"]) this.sourcePageFilter = params["sourcePageId"];
    if (params["page"]) this.page = parseInt(params["page"], 10) || 1;
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.statusFilter !== "All" ? this.statusFilter : null,
        dateRange: this.dateRangeFilter,
        sourcePageId: this.sourcePageFilter || null,
        page: this.page > 1 ? this.page : null,
      },
      queryParamsHandling: "merge",
    });
  }

  private loadSourcePages(): void {
    this.sourceService
      .getAllSourcePages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pages) => {
          this.sourcePages = pages;
          this.cdr.markForCheck();
        },
      });
  }

  private setupSearchWatch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadAllData();
      });
  }

  loadAllData(): void {
    this.isLoading = true;
    this.activeActionMenuId = null;
    this.cdr.markForCheck();

    const queryParams: any = {
      searchTerm: this.searchControl.value,
      status: this.statusFilter,
      dateRange: this.dateRangeFilter,
      page: this.page,
      pageSize: this.pageSize,
    };

    if (this.sourcePageFilter) {
      queryParams.sourcePageId = parseInt(this.sourcePageFilter, 10);
    }

    if (this.dateRangeFilter === "Custom") {
      if (this.customStartDate) queryParams.startDate = this.customStartDate;
      if (this.customEndDate) queryParams.endDate = this.customEndDate;
    }

    // Fetch Stats and Items in parallel
    this.apiService.getIncompleteOrders(queryParams).subscribe({
      next: (res) => {
        this.orders = res.items;
        this.totalResults = res.total;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(err.error?.message || "Failed to load incomplete orders");
        this.cdr.markForCheck();
      },
    });

    this.apiService.getIncompleteOrderStats(queryParams).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.updateQueryParams();
    this.loadAllData();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.updateQueryParams();
    this.loadAllData();
  }

  toggleActionMenu(event: MouseEvent, orderId: number): void {
    event.stopPropagation();
    if (this.activeActionMenuId === orderId) {
      this.activeActionMenuId = null;
    } else {
      this.activeActionMenuId = orderId;
    }
  }

  closeActionMenu(): void {
    this.activeActionMenuId = null;
  }

  // --- ACTIONS ---

  whatsappFollowUp(order: Order): void {
    this.activeActionMenuId = null;
    let phone = order.customerPhone.trim();
    
    // Format Bangladeshi phone number to international wa.me format
    // e.g., starts with 0 -> remove 0, prepend 880
    if (phone.startsWith("0")) {
      phone = "88" + phone;
    } else if (!phone.startsWith("88") && phone.length === 10) {
      phone = "880" + phone;
    }

    const banglaMessage = "আপনি আপনার অর্ডারটি সম্পূর্ণ করেননি। এখনই অর্ডার কনফার্ম করুন এবং বিশেষ অফার পান।";
    const encodedText = encodeURIComponent(banglaMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;

    // Mark as Contacted on click
    if (order.status === OrderStatus.Incomplete) {
      this.apiService.updateStatus(order.id, OrderStatus.IncompleteContacted, "WhatsApp Follow-up initiated").subscribe({
        next: () => {
          this.loadAllData();
          window.open(whatsappUrl, "_blank");
        },
        error: () => {
          window.open(whatsappUrl, "_blank");
        }
      });
    } else {
      window.open(whatsappUrl, "_blank");
    }
  }

  callFollowUp(order: Order): void {
    this.activeActionMenuId = null;
    const phone = order.customerPhone.trim();
    
    // Mark as Contacted on click
    if (order.status === OrderStatus.Incomplete) {
      this.apiService.updateStatus(order.id, OrderStatus.IncompleteContacted, "Call Follow-up initiated").subscribe({
        next: () => {
          this.loadAllData();
          window.location.href = `tel:${phone}`;
        },
        error: () => {
          window.location.href = `tel:${phone}`;
        }
      });
    } else {
      window.location.href = `tel:${phone}`;
    }
  }

  openNotesModal(order: Order): void {
    this.activeActionMenuId = null;
    this.selectedOrder = order;
    this.newNoteContent = "";
    this.isNotesModalOpen = true;
    this.cdr.markForCheck();
  }

  closeNotesModal(): void {
    this.isNotesModalOpen = false;
    this.selectedOrder = null;
    this.newNoteContent = "";
    this.cdr.markForCheck();
  }

  saveNote(): void {
    if (!this.selectedOrder || !this.newNoteContent.trim()) return;

    this.apiService.updateStatus(
      this.selectedOrder.id, 
      this.selectedOrder.status, 
      this.newNoteContent.trim()
    ).subscribe({
      next: () => {
        this.notification.success("Note added successfully");
        this.closeNotesModal();
        this.loadAllData();
      },
      error: (err) => {
        this.notification.error(err.error?.message || "Failed to add note");
      }
    });
  }

  markAsLost(order: Order): void {
    this.activeActionMenuId = null;
    if (!confirm(`Are you sure you want to mark lead from ${order.customerName || 'Customer'} as Lost?`)) return;

    this.apiService.updateStatus(order.id, OrderStatus.IncompleteLost, "Marked as lost by admin").subscribe({
      next: () => {
        this.notification.success("Lead marked as lost");
        this.loadAllData();
      },
      error: (err) => {
        this.notification.error(err.error?.message || "Failed to update status");
      }
    });
  }

  convertToRealOrder(order: Order): void {
    this.activeActionMenuId = null;
    if (!confirm(`Do you want to convert this incomplete order for ${order.customerName || 'Customer'} into a confirmed order?`)) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.apiService.convertToOrder(order.id).subscribe({
      next: (res) => {
        this.notification.success(`Successfully converted to Confirmed Order #${res.orderNumber}!`);
        this.loadAllData();
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(err.error?.message || "Failed to convert order");
        this.cdr.markForCheck();
      }
    });
  }

  // --- STYLING HELPERS ---

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Incomplete:
        return "border-ds-warning/50 bg-ds-warning-bg text-ds-warning";
      case OrderStatus.IncompleteContacted:
        return "border-ds-info/50 bg-ds-info-bg text-ds-info";
      case OrderStatus.IncompleteLost:
        return "border-ds-danger/50 bg-ds-danger-bg text-ds-danger";
      default:
        return "border-ds-border bg-ds-surface text-ds-text-secondary";
    }
  }

  gettotalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize);
  }

  getPagesArray(): number[] {
    const total = this.gettotalPages();
    const arr = [];
    for (let i = 1; i <= total; i++) arr.push(i);
    return arr;
  }
}
