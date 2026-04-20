import { CommonModule } from "@angular/common";
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";

import {
  Order,
  OrderDetail,
  OrderStatus,
  OrdersQueryParams,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { AdminOrderInvoiceComponent } from "./components/admin-order-invoice/admin-order-invoice.component";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { SourceManagementService } from "../../../core/services/source-management.service";
import { SocialMediaSource, SourcePage } from "../../../core/models/order-source";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

interface OrderStats {
  totalOrders: number;
  processing: number;
  totalRevenue: number;
  refundRequests: number;
}

@Component({
  selector: "app-admin-orders",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    PriceDisplayComponent,
    AppIconComponent,
    AdminOrderInvoiceComponent,
  ],
  templateUrl: "./admin-orders.component.html",
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sourceService = inject(SourceManagementService);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  isRefreshing = false;
  searchControl = new FormControl("", { nonNullable: true });

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  invoiceOrder: OrderDetail | null = null;
  isInvoiceLoading = false;
  totalResults = 0;
  page = 1;
  pageSize = 10;

  statusOptions: OrdersQueryParams["status"][] = [
    "All",
    "Pending",
    "Confirmed",
    "Processing",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Hold",
    "Return",
    "Exchange",
    "ReturnProcess",
    "Refund",
    "PreOrder",
  ];

  updateStatusOptions = this.statusOptions.filter((s): s is OrderStatus => s !== 'All' && s !== 'All Statuses' as any);

  statusClass(status: string): string {
    switch (status) {
      case "Pending":
        return "border-amber-500 bg-amber-50/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200";
      case "Confirmed":
        return "border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200";
      case "Processing":
        return "border-yellow-500 bg-yellow-50/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200";
      case "Packed":
        return "border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200";
      case "Shipped":
        return "border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200";
      case "Delivered":
        return "border-accent bg-accent/10 text-primary dark:bg-accent/20 dark:text-accent";
      case "Cancelled":
      case "Refund":
        return "border-red-500 bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-200";
      case "Hold":
        return "border-gray-500 bg-gray-50/50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-200";
      case "PreOrder":
        return "border-violet-500 bg-violet-50/50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200";
      default:
        return "border-gray-300 bg-gray-50 text-gray-700";
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case "Pending": return "#f59e0b";
      case "Confirmed": return "#10b981";
      case "Processing": return "#eab308";
      case "Packed": return "#6366f1";
      case "Shipped": return "#3b82f6";
      case "Delivered": return "#0d4c5e";
      case "Cancelled": return "#ef4444";
      case "Hold": return "#6b7280";
      case "PreOrder": return "#8b5cf6";
      case "Return":
      case "ReturnProcess":
        return "#ec4899";
      case "Exchange":
        return "#8b5cf6";
      case "Refund":
        return "#f43f5e";
      default: return "#94a3b8";
    }
  }

  getStatusIconName(status: string): string {
    switch (status) {
      case "Pending": return "Clock";
      case "Confirmed": return "CheckCircle";
      case "Processing": return "RotateCw";
      case "Packed": return "Package";
      case "Shipped": return "Truck";
      case "Delivered": return "CheckCircle";
      case "Cancelled": return "XCircle";
      case "Hold": return "AlertTriangle";
      case "Refund": return "RotateCcw";
      case "PreOrder": return "ArrowRightCircle";
      case "Return":
      case "ReturnProcess":
        return "AlertCircle";
      default: return "Package";
    }
  }

  getNextStatus(status: string): OrderStatus | null {
    if (status === "Pending") return "Confirmed";
    if (status === "Confirmed") return "Processing";
    if (status === "Processing") return "Packed";
    if (status === "Packed") return "Shipped";
    if (status === "Shipped") return "Delivered";
    return null;
  }

  nextStatusLabel(order: Order): string | null {
    const nextStatus = this.getNextStatus(order.status);
    if (!nextStatus) return null;
    if (nextStatus === "Confirmed") return "Confirm Order";
    if (nextStatus === "Processing") return "Mark as Processing";
    if (nextStatus === "Packed") return "Mark as Packed";
    if (nextStatus === "Shipped") return "Mark as Shipped";
    return "Mark as Delivered";
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
  
  sourcePages: SourcePage[] = [];
  socialMediaSources: SocialMediaSource[] = [];

  statusMenuOpen = false;
  dateMenuOpen = false;
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
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadOrders();
      });
  }

  loadSources(): void {
    this.sourceService.getAllSourcePages().subscribe(pages => this.sourcePages = pages);
    this.sourceService.getAllSocialMediaSources().subscribe(sources => this.socialMediaSources = sources);
  }

  setSourcePageFilter(id: number | null): void {
    this.selectedSourcePageId = id;
    this.page = 1;
    this.loadOrders();
  }

  setSocialMediaFilter(id: number | null): void {
    this.selectedSocialMediaSourceId = id;
    this.page = 1;
    this.loadOrders();
  }

  setOrderTypeFilter(type: any): void {
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
        error: () => this.notification.error("Failed to update status")
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
      this.ordersService.updateStatus(order.id, "Cancelled", "Cancelled from index").subscribe(() => {
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
      },
      error: () => {
        this.isSavingNote = false;
        this.notification.error("Failed to add note");
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
      error: () => this.isSavingNote = false
    });
  }

  sendReminder(order: Order, event: Event): void {
    event.stopPropagation();
    const phone = order.customerPhone.replace(/\D/g, '');
    const msg = `Hello ${order.customerName || 'Customer'}, your order #${order.orderNumber} is pending. Please confirm by calling this number (01725455554).`;
    
    // Copy to clipboard as a backup
    navigator.clipboard.writeText(msg);
    
    // Trigger SMS protocol - Using '?' for compatibility, though iOS sometimes prefers ';'
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
      this.ordersService.updateStatus(order.id, "PreOrder", "Moved to Pre-Order").subscribe(() => {
        this.loadOrders(false);
      });
    }
  }

  moveToMainOrder(order: Order, event: Event): void {
    event.stopPropagation();
    if (window.confirm("Move this Pre-Order to Main Order (Pending)?")) {
      this.ordersService.updateStatus(order.id, "Pending", "Converted from Pre-Order").subscribe(() => {
        this.loadOrders(false);
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
      },
      error: () => {
        this.isInvoiceLoading = false;
        this.notification.error("Failed to load order details for invoice");
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
      searchTerm: this.searchControl.value,
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
        },
        error: () => {
            this.isLoading = false;
            this.isRefreshing = false;
        }
      });

    this.ordersService
      .getFilteredOrders(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe((orders) => {
        this.filteredOrders = orders;
        this.updateStats(orders);
      });
  }

  avatarClass(order: Order): string {
    const index = order.id % this.avatarStyles.length;
    return this.avatarStyles[index];
  }

  getCustomerInitials(name: string): string {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  private updateStats(orders: Order[]): void {
    const processing = orders.filter(
      (order) => order.status === "Processing" || order.status === "Pending",
    ).length;
    const refunds = orders.filter((order) => order.status === "Refund").length;
    const revenue = orders.reduce((total, order) => total + order.total, 0);

    this.stats = {
      totalOrders: orders.length,
      processing,
      totalRevenue: revenue,
      refundRequests: refunds,
    };
  }
}
