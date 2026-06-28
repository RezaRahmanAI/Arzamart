import { NgIf, NgClass, NgStyle, DatePipe, NgFor } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectorRef,
  DestroyRef,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import {
  Order,
  OrderItem,
  OrderStatus,
  OrdersQueryParams,
  OrderStats,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { OrderInvoiceComponent } from "./components/admin-order-invoice/order-invoice.component";
import { OrderTrackingModalComponent } from "./components/order-tracking-modal/order-tracking-modal.component";
import { OrderNotesModalComponent } from "./components/order-notes-modal/order-notes-modal.component";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { SourceManagementService } from "../../../core/services/source-management.service";
import { SocialMediaSource, SourcePage } from "../../../core/models/order-source";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-orders",
  standalone: true,
  imports: [NgIf, NgClass, NgStyle, DatePipe, ReactiveFormsModule, FormsModule, RouterModule, PriceDisplayComponent, AppIconComponent, OrderInvoiceComponent, OrderTrackingModalComponent, OrderNotesModalComponent, NgFor],
  templateUrl: "./orders.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sourceService = inject(SourceManagementService);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isRefreshing = false;
  orderIdSearchControl = new FormControl("", { nonNullable: true });
  phoneSearchControl = new FormControl("", { nonNullable: true });


  orders: Order[] = [];
  invoiceOrder: Order | null = null;
  isInvoiceLoading = false;
  totalResults = 0;
  page = 1;
  pageSize = 10;

  statusOptions: OrdersQueryParams["status"][] = [
    "All",
    OrderStatus.Pending,
    OrderStatus.Confirmed,
    OrderStatus.Processing,
    OrderStatus.Packed,
    OrderStatus.Shipped,
    OrderStatus.Delivered,
    OrderStatus.Cancelled,
    OrderStatus.Hold,
    OrderStatus.Return,
    OrderStatus.Exchange,
    OrderStatus.ReturnProcess,
    OrderStatus.Refund,
    OrderStatus.PreOrder,
  ];

  updateStatusOptions = this.statusOptions.filter((s): s is OrderStatus => s !== 'All' && s !== 'All Statuses' as any);

  private static readonly STATUS_CLASSES: Record<string, string> = {
    Pending: "border-ds-warning/50 bg-ds-warning-bg text-ds-warning",
    Confirmed: "border-ds-success/50 bg-ds-success-bg text-ds-success",
    Processing: "border-ds-warning/50 bg-ds-warning-bg text-ds-warning",
    Packed: "border-ds-info/50 bg-ds-info-bg text-ds-info",
    Shipped: "border-ds-info/50 bg-ds-info-bg text-ds-info",
    Delivered: "border-ds-success/50 bg-ds-success-bg text-ds-success",
    Cancelled: "border-ds-danger/50 bg-ds-danger-bg text-ds-danger",
    Refund: "border-ds-danger/50 bg-ds-danger-bg text-ds-danger",
    Hold: "border-ds-text-muted/50 bg-ds-surface text-ds-text-secondary",
    PreOrder: "border-ds-info/50 bg-ds-info-bg text-ds-info",
  };

  private static readonly STATUS_COLORS: Record<string, string> = {
    Pending: "var(--status-pending)", Confirmed: "var(--status-confirmed)", Processing: "var(--status-processing)",
    Packed: "var(--status-packed)", Shipped: "var(--status-shipped)", Delivered: "var(--status-delivered)",
    Cancelled: "var(--status-cancelled)", Hold: "var(--status-hold)", PreOrder: "var(--status-preorder)",
    Return: "var(--status-return)", ReturnProcess: "var(--status-return)", Exchange: "var(--status-preorder)",
    Refund: "var(--status-refund)",
  };

  private static readonly STATUS_ICONS: Record<string, string> = {
    Pending: "Clock", Confirmed: "CheckCircle", Processing: "RotateCw",
    Packed: "Package", Shipped: "Truck", Delivered: "CheckCircle",
    Cancelled: "XCircle", Hold: "AlertTriangle", Refund: "RotateCcw",
    PreOrder: "ArrowRightCircle", Return: "AlertCircle", ReturnProcess: "AlertCircle",
  };

  private static readonly NEXT_STATUS: Record<string, OrderStatus> = {
    Pending: OrderStatus.Confirmed, Confirmed: OrderStatus.Processing, Processing: OrderStatus.Packed,
    Packed: OrderStatus.Shipped, Shipped: OrderStatus.Delivered,
  };

  private static readonly NEXT_STATUS_LABELS: Record<string, string> = {
    Confirmed: "Confirm Order", Processing: "Mark as Processing",
    Packed: "Mark as Packed", Shipped: "Mark as Shipped",
    Delivered: "Mark as Delivered",
  };

  statusClass(status: string): string {
    return OrdersComponent.STATUS_CLASSES[status] || "border-ds-border bg-ds-surface text-ds-text-secondary";
  }

  getStatusColor(status: string): string {
    return OrdersComponent.STATUS_COLORS[status] || "var(--status-hold)";
  }

  getStatusIconName(status: string): string {
    return OrdersComponent.STATUS_ICONS[status] || "Package";
  }

  getNextStatus(status: string): OrderStatus | null {
    return OrdersComponent.NEXT_STATUS[status] || null;
  }

  nextStatusLabel(order: Order): string | null {
    const nextStatus = this.getNextStatus(order.status);
    return nextStatus ? (OrdersComponent.NEXT_STATUS_LABELS[nextStatus] || null) : null;
  }

  dateRanges: OrdersQueryParams["dateRange"][] = [
    "Today",
    "Yesterday",
    "Last 7 Days",
    "Last 30 Days",
    "This Year",
    "All Time",
  ];

  selectedStatus: OrdersQueryParams["status"] = "All";
  selectedDateRange: OrdersQueryParams["dateRange"] = "Last 30 Days";
  selectedSourcePageId: number | null = null;
  selectedSocialMediaSourceId: number | null = null;
  selectedCustomerPhone: string | null = null;

  
  sourcePages: SourcePage[] = [];
  socialMediaSources: SocialMediaSource[] = [];


  statusMenuOpen = false;
  dateMenuOpen = false;
  sourceMenuOpen = false;
  filtersMenuOpen = false;
  statusUpdateOrderId: number | null = null;
  actionMenuOpenId: number | null = null;
  isPreOrderMode = false;
  isWebsiteOnlyMode = false;
  selectedOrderType: 'All' | 'PreOrder' | 'Website' | 'Manual' = 'All';

  selectedOrderIds = new Set<number>();

  stats: OrderStats = {
    totalOrders: 0,
    processing: 0,
    totalRevenue: 0,
    refundRequests: 0,
  };

  trackingOrder: Order | null = null;
  notesOrder: Order | null = null;
  isTrackingModalOpen = false;
  isNotesModalOpen = false;

  customStartDate: string | null = null;
  customEndDate: string | null = null;
  tempStartDate: string | null = null;
  tempEndDate: string | null = null;

  avatarStyles = [
    "bg-ds-warning-bg text-ds-warning",
    "bg-ds-info-bg text-ds-info",
    "bg-ds-info-bg text-ds-info",
    "bg-ds-surface-2 text-ds-text-secondary",
    "bg-ds-danger-bg text-ds-danger",
    "bg-ds-success-bg text-ds-success",
  ];

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.isPreOrderMode = !!data['preOrderOnly'];
      this.isWebsiteOnlyMode = !!data['websiteOnly'];
      this.loadOrders();
      this.loadSources();
      this.cdr.markForCheck();
    });

    this.orderIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadOrders();
      });

    this.phoneSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadOrders();
      });


  }

  loadSources(): void {
    this.sourceService.getAllSourcePages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pages => {
      this.sourcePages = pages;
      this.cdr.markForCheck();
    });
    this.sourceService.getAllSocialMediaSources().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sources => {
      this.socialMediaSources = sources;
      this.cdr.markForCheck();
    });
  }

  setSourcePageFilter(id: string | number | null): void {
    const value = id === 'null' || id === null ? null : Number(id);
    this.selectedSourcePageId = value;
    this.page = 1;
    this.loadOrders();
  }

  setSocialMediaFilter(id: string | number | null): void {
    const value = id === 'null' || id === null ? null : Number(id);
    this.selectedSocialMediaSourceId = value;
    this.page = 1;
    this.loadOrders();
  }

  setOrderTypeFilter(type: 'All' | 'PreOrder' | 'Website' | 'Manual'): void {
    this.selectedOrderType = type;
    this.page = 1;
    this.loadOrders();
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:click")
  closeMenus(): void {
    this.statusMenuOpen = false;
    this.dateMenuOpen = false;
    this.sourceMenuOpen = false;
    this.filtersMenuOpen = false;
    this.statusUpdateOrderId = null;
    this.actionMenuOpenId = null;
  }

  @HostListener("document:keydown.escape")
  handleEscape(): void {
    this.statusMenuOpen = false;
    this.dateMenuOpen = false;
    this.filtersMenuOpen = false;
    this.actionMenuOpenId = null;
    this.isTrackingModalOpen = false;
    this.isNotesModalOpen = false;
  }

  toggleFiltersMenu(event: Event): void {
    event.stopPropagation();
    this.filtersMenuOpen = !this.filtersMenuOpen;
    this.dateMenuOpen = false;
    this.statusMenuOpen = false;
    this.sourceMenuOpen = false;
  }

  resetFilters(event: Event): void {
    event.stopPropagation();
    this.selectedStatus = 'All';
    this.selectedOrderType = 'All';
    this.selectedSourcePageId = null;
    this.selectedSocialMediaSourceId = null;
    this.page = 1;
    this.loadOrders();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.selectedStatus !== 'All') count++;
    if (this.selectedOrderType !== 'All') count++;
    if (this.selectedSourcePageId || this.selectedSocialMediaSourceId) count++;
    return count;
  }

  toggleStatusMenu(event: Event): void {
    event.stopPropagation();
    this.statusMenuOpen = !this.statusMenuOpen;
    this.dateMenuOpen = false;
  }

  toggleDateMenu(event: Event): void {
    event.stopPropagation();
    this.dateMenuOpen = !this.dateMenuOpen;
    this.statusMenuOpen = false;
  }

  setStatusFilter(status: OrdersQueryParams["status"], event: Event): void {
    event.stopPropagation();
    this.selectedStatus = status;
    this.page = 1;
    this.loadOrders();
  }

  toggleStatusUpdateMenu(orderId: number, event: Event): void {
    event.stopPropagation();
    this.statusUpdateOrderId = this.statusUpdateOrderId === orderId ? null : orderId;
    this.dateMenuOpen = false;
    this.statusMenuOpen = false;
    this.actionMenuOpenId = null;
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus, event: Event): void {
    event.stopPropagation();
    this.statusUpdateOrderId = null;
    
    this.ordersService.updateStatus(orderId, newStatus, `Status updated to ${newStatus}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadOrders(false),
        error: () => {
            this.notification.error("Failed to update status");
            this.cdr.markForCheck();
        }
    });
  }

  setDateRange(range: OrdersQueryParams["dateRange"], event: Event): void {
    event.stopPropagation();
    this.selectedDateRange = range;
    if (range !== "Custom") {
      this.customStartDate = null;
      this.customEndDate = null;
    }
    this.dateMenuOpen = false;
    this.page = 1;
    this.loadOrders();
  }

  applyCustomRange(event: Event): void {
    event.stopPropagation();
    if (this.tempStartDate && this.tempEndDate) {
      this.customStartDate = this.tempStartDate;
      this.customEndDate = this.tempEndDate;
      this.selectedDateRange = "Custom";
      this.dateMenuOpen = false;
      this.page = 1;
      this.loadOrders();
    }
  }

  get activeDateRangeLabel(): string {
    if (this.selectedDateRange === "Custom" && this.customStartDate && this.customEndDate) {
      const start = new Date(this.customStartDate);
      const end = new Date(this.customEndDate);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }
    return this.selectedDateRange;
  }

  get selectedSourceLabel(): string {
    if (this.selectedSourcePageId) {
      const page = this.sourcePages.find(p => p.id === this.selectedSourcePageId);
      return page ? page.name : 'Page';
    }
    if (this.selectedSocialMediaSourceId) {
      const source = this.socialMediaSources.find(s => s.id === this.selectedSocialMediaSourceId);
      return source ? source.name : 'Social';
    }
    return 'Sources';
  }

  showMoreFilters(event: Event): void {
    event.stopPropagation();
    this.notification.info("More filters coming soon.");
  }

  toggleSelectAll(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.orders.forEach((order) => this.selectedOrderIds.add(order.id));
    } else {
      this.orders.forEach((order) => this.selectedOrderIds.delete(order.id));
    }
  }

  toggleSelectOrder(orderId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedOrderIds.add(orderId);
    } else {
      this.selectedOrderIds.delete(orderId);
    }
  }

  toggleRowActions(orderId: number, event: Event): void {
    event.stopPropagation();
    this.actionMenuOpenId = this.actionMenuOpenId === orderId ? null : orderId;
  }

  viewDetails(event: Event): void {
    event.stopPropagation();
    this.actionMenuOpenId = null;
  }

  markNextStatus(order: Order, event: Event): void {
    event.stopPropagation();
    const nextStatus = this.getNextStatus(order.status);
    if (nextStatus) {
      this.ordersService.updateStatus(order.id, nextStatus, `Moved to ${nextStatus}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadOrders(false),
        error: () => {
          this.notification.error("Failed to update status");
          this.cdr.markForCheck();
        }
      });
    }
    this.actionMenuOpenId = null;
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();
    const shouldCancel = window.confirm("Cancel this order?");
    if (shouldCancel) {
      this.ordersService.updateStatus(order.id, OrderStatus.Cancelled, "Cancelled from index").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadOrders(false),
        error: () => {
          this.notification.error("Failed to cancel order");
          this.cdr.markForCheck();
        }
      });
    }
    this.actionMenuOpenId = null;
  }

  editOrder(order: Order, event: Event): void {
    event.stopPropagation();
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.router.navigate(["/admin/orders", order.id, "edit"]);
  }

  openTracking(order: Order, event: Event): void {
    event.stopPropagation();
    this.trackingOrder = order;
    this.isTrackingModalOpen = true;
    this.cdr.markForCheck();
  }

  openNotes(order: Order, event: Event): void {
    event.stopPropagation();
    this.notesOrder = order;
    this.isNotesModalOpen = true;
    this.cdr.markForCheck();
  }

  onNoteAdded(updatedOrder: Order): void {
    const index = this.orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = updatedOrder;
    }
    this.cdr.markForCheck();
  }

  sendReminder(order: Order, event: Event): void {
    event.stopPropagation();
    const phone = order.customerPhone.replace(/\D/g, '');
    const msg = `Hello ${order.customerName || 'Customer'}, your order #${order.orderNumber} is pending. Please confirm by calling this number (01725455554).`;
    
    // Copy to clipboard as a backup
    navigator.clipboard.writeText(msg);
    
    // Trigger SMS protocol - Using '? ' for compatibility, though iOS sometimes prefers ';'
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(msg)}`;
    
    try {
      window.location.href = smsUrl;
      this.notification.success("Opening SMS app...");
    } catch (err) {
      this.notification.success("Reminder Text copied to clipboard!");
    }
  }

  sendWhatsApp(order: Order, event: Event): void {
    event.stopPropagation();
    const phone = order.customerPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hello ${order.customerName}, about your order #${order.orderNumber}...`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  moveToPreOrder(order: Order, event: Event): void {
    event.stopPropagation();
    if (window.confirm("Move this order to Pre-Order?")) {
      this.ordersService.updateStatus(order.id, OrderStatus.PreOrder, "Moved to Pre-Order").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadOrders(false),
        error: () => {
          this.notification.error("Failed to move to pre-order");
          this.cdr.markForCheck();
        }
      });
    }
  }

  moveToMainOrder(order: Order, event: Event): void {
    event.stopPropagation();
    if (window.confirm("Transfer this Pre-Order to Main Order? This will enable stock deduction logic.")) {
      this.ordersService.transferToMainOrder(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
            this.notification.success("Order transferred to main pool");
            this.loadOrders(false);
        },
        error: () => {
            this.notification.error("Failed to transfer order");
            this.cdr.markForCheck();
        }
      });
    }
  }

  printInvoice(order: Order, event: Event): void {
    event.stopPropagation();
    this.isInvoiceLoading = true;
    this.cdr.markForCheck();
    this.ordersService.getOrderById(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (details) => {
        this.invoiceOrder = details;
        this.isInvoiceLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isInvoiceLoading = false;
        this.notification.error("Failed to load order details for invoice");
        this.cdr.markForCheck();
      }
    });
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.loadOrders(false);
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.loadOrders(false);
    }
  }

  isAllVisibleSelected(): boolean {
    return (
      this.orders.length > 0 &&
      this.orders.every((order) => this.selectedOrderIds.has(order.id))
    );
  }

  isIndeterminate(): boolean {
    const selectedVisible = this.orders.filter((order) =>
      this.selectedOrderIds.has(order.id),
    );
    return (
      selectedVisible.length > 0 && selectedVisible.length < this.orders.length
    );
  }

  trackByOrderId(_: number, order: Order): number {
    return order.id;
  }

  trackByStatusOption(_: number, status: string): string {
    return status;
  }

  trackByDateRange(_: number, range: string): string {
    return range;
  }

  trackBySourcePage(_: number, page: SourcePage): number {
    return page.id;
  }

  trackBySocialMediaSource(_: number, source: SocialMediaSource): number {
    return source.id;
  }

  trackByOrderItem(_: number, item: OrderItem): string {
    return `${item.productId}-${item.size || ''}`;
  }

  get paginationStart(): number {
    if (this.totalResults === 0) {
      return 0;
    }
    return (this.page - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalResults);
  }

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize) || 1;
  }

  private buildParams(): OrdersQueryParams {
    const params: OrdersQueryParams = {
      searchTerm: "", // Clearing general search
      orderNumber: this.orderIdSearchControl.value || undefined,
      customerPhone: this.phoneSearchControl.value || this.selectedCustomerPhone || undefined,
      status: this.selectedStatus,
      dateRange: this.selectedDateRange,
      page: this.page,
      pageSize: this.pageSize,
      preOrderOnly: this.isPreOrderMode || this.selectedOrderType === 'PreOrder',
      websiteOnly: this.isWebsiteOnlyMode || this.selectedOrderType === 'Website',
      manualOnly: this.selectedOrderType === 'Manual',
      sourcePageId: this.selectedSourcePageId || undefined,
      socialMediaSourceId: this.selectedSocialMediaSourceId || undefined,

    };

    if (this.selectedDateRange === "Custom" && this.customStartDate && this.customEndDate) {
        params.startDate = this.customStartDate;
        params.endDate = this.customEndDate;
    }

    return params;
  }

  refreshOrders(): void {
    this.isRefreshing = true;
    this.loadOrders(false, true);
  }

  loadOrders(resetSelection = true, forceRefresh = false): void {
    const params = this.buildParams();
    this.isLoading = true;
    this.cdr.markForCheck();
    this.ordersService
      .getOrders(params, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orders = data.items;
          this.totalResults = data.total;
          if (resetSelection) {
            this.selectedOrderIds.clear();
          }
          this.isLoading = false;
          this.isRefreshing = false;
          this.cdr.markForCheck();
        },
        error: () => {
            this.isLoading = false;
            this.isRefreshing = false;
            this.cdr.markForCheck();
        }
      });

    this.ordersService
      .getOrderStats(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      });
  }

  avatarClass(order: Order): string {
    const index = order.id % this.avatarStyles.length;
    return this.avatarStyles[index];
  }

  copyToClipboard(text: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      this.notification.success(`Copied: ${text}`);
    }).catch(() => {
      this.notification.error("Failed to copy to clipboard");
    });
  }

}
