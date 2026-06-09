import { NgIf, NgClass, NgStyle, DatePipe, NgFor } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectorRef,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";

import {
  Order,
  OrderDetail,
  OrderItem,
  OrderLog,
  OrderNote,
  OrderStatus,
  OrdersQueryParams,
  OrderStats,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { OrderInvoiceComponent } from "./components/admin-order-invoice/order-invoice.component";
import { ProductsService } from "../../services/products.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { SourceManagementService } from "../../../core/services/source-management.service";
import { SocialMediaSource, SourcePage } from "../../../core/models/order-source";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-orders",
  standalone: true,
  imports: [NgIf, NgClass, NgStyle, DatePipe, ReactiveFormsModule, FormsModule, RouterModule, PriceDisplayComponent, AppIconComponent, OrderInvoiceComponent, NgFor],
  templateUrl: "./orders.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sourceService = inject(SourceManagementService);
  private notification = inject(NotificationService);
  private productService = inject(ProductsService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isRefreshing = false;
  orderIdSearchControl = new FormControl("", { nonNullable: true });
  phoneSearchControl = new FormControl("", { nonNullable: true });


  orders: Order[] = [];
  invoiceOrder: OrderDetail | null = null;
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
    Pending: "border-amber-500 bg-amber-50/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200",
    Confirmed: "border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200",
    Processing: "border-yellow-500 bg-yellow-50/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200",
    Packed: "border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200",
    Shipped: "border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200",
    Delivered: "border-accent bg-accent/10 text-primary dark:bg-accent/20 dark:text-accent",
    Cancelled: "border-red-500 bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-200",
    Refund: "border-red-500 bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-200",
    Hold: "border-gray-500 bg-gray-50/50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-200",
    PreOrder: "border-violet-500 bg-violet-50/50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200",
  };

  private static readonly STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b", Confirmed: "#10b981", Processing: "#eab308",
    Packed: "#6366f1", Shipped: "#3b82f6", Delivered: "#0d4c5e",
    Cancelled: "#ef4444", Hold: "#6b7280", PreOrder: "#8b5cf6",
    Return: "#ec4899", ReturnProcess: "#ec4899", Exchange: "#8b5cf6",
    Refund: "#f43f5e",
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
    return OrdersComponent.STATUS_CLASSES[status] || "border-gray-300 bg-gray-50 text-gray-700";
  }

  getStatusColor(status: string): string {
    return OrdersComponent.STATUS_COLORS[status] || "#94a3b8";
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
  adminNoteControl = new FormControl("");
  newNoteText = "";
  isSavingNote = false;

  customStartDate: string | null = null;
  customEndDate: string | null = null;
  tempStartDate: string | null = null;
  tempEndDate: string | null = null;

  avatarStyles = [
    "bg-orange-100 text-orange-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-gray-200 text-gray-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
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
    this.sourceService.getAllSourcePages().subscribe(pages => {
      this.sourcePages = pages;
      this.cdr.markForCheck();
    });
    this.sourceService.getAllSocialMediaSources().subscribe(sources => {
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
    this.statusUpdateOrderId = null;
    this.actionMenuOpenId = null;
  }

  @HostListener("document:keydown.escape")
  handleEscape(): void {
    this.statusMenuOpen = false;
    this.dateMenuOpen = false;
    this.actionMenuOpenId = null;
    this.isTrackingModalOpen = false;
    this.isNotesModalOpen = false;
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
    this.statusMenuOpen = false;
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
    
    this.ordersService.updateStatus(orderId, newStatus, `Status updated to ${newStatus}`).subscribe({
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
      this.ordersService.updateStatus(order.id, nextStatus, `Moved to ${nextStatus}`).subscribe(() => {
        this.loadOrders(false);
      });
    }
    this.actionMenuOpenId = null;
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();
    const shouldCancel = window.confirm("Cancel this order?");
    if (shouldCancel) {
      this.ordersService.updateStatus(order.id, OrderStatus.Cancelled, "Cancelled from index").subscribe(() => {
        this.loadOrders(false);
      });
    }
    this.actionMenuOpenId = null;
  }

  editOrder(order: Order, event: Event): void {
    event.stopPropagation();
    this.router.navigate(["/admin/orders", order.id, "edit"]);
  }

  openTracking(order: Order, event: Event): void {
    event.stopPropagation();
    this.trackingOrder = order;
    this.isTrackingModalOpen = true;
  }

  openNotes(order: Order, event: Event): void {
    event.stopPropagation();
    this.notesOrder = order;
    this.newNoteText = "";
    this.isNotesModalOpen = true;
  }

  addNote(): void {
    if (!this.notesOrder || !this.newNoteText.trim()) return;
    this.isSavingNote = true;
    
    this.ordersService.addOrderNote(this.notesOrder.id, this.newNoteText.trim()).subscribe({
      next: (updatedOrder) => {
        this.notesOrder!.notes = updatedOrder.notes;
        this.newNoteText = "";
        this.isSavingNote = false;
        const index = this.orders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSavingNote = false;
        this.notification.error("Failed to add note");
        this.cdr.markForCheck();
      }
    });
  }

  saveNote(): void {
    if (!this.notesOrder) return;
    this.isSavingNote = true;
    const note = this.adminNoteControl.value || "";
    
    this.ordersService.updateStatus(this.notesOrder.id, this.notesOrder.status, note).subscribe({
      next: () => {
        this.notesOrder!.adminNote = note;
        this.isSavingNote = false;
        this.isNotesModalOpen = false;
        this.loadOrders(false);
      },
      error: () => {
        this.isSavingNote = false;
        this.cdr.markForCheck();
      }
    });
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
      this.ordersService.updateStatus(order.id, OrderStatus.PreOrder, "Moved to Pre-Order").subscribe(() => {
        this.loadOrders(false);
      });
    }
  }

  moveToMainOrder(order: Order, event: Event): void {
    event.stopPropagation();
    if (window.confirm("Transfer this Pre-Order to Main Order? This will enable stock deduction logic.")) {
      this.ordersService.transferToMainOrder(order.id).subscribe({
        next: () => {
            this.notification.success("Order transferred to main pool");
            this.loadOrders(false);
        },
        error: () => this.notification.error("Failed to transfer order")
      });
    }
  }

  printInvoice(order: Order, event: Event): void {
    event.stopPropagation();
    this.isInvoiceLoading = true;
    this.ordersService.getOrderById(order.id).subscribe({
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

  trackByLogIndex(_: number, log: OrderLog): number {
    return log.id;
  }

  trackByNoteId(_: number, note: OrderNote): string {
    return note.createdAt;
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
