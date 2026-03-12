import { CommonModule } from "@angular/common";
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import {
  LucideAngularModule,
  Printer,
  Download,
  ShoppingBag,
  Package,
  CreditCard,
  RotateCcw,
  Search,
  ChevronDown,
  Check,
  MoreVertical,
  Eye,
  Forward,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-angular";

import {
  Order,
  OrderStatus,
  OrdersQueryParams,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";

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
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./admin-orders.component.html",
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  readonly icons = {
    Printer,
    Download,
    ShoppingBag,
    Package,
    CreditCard,
    RotateCcw,
    Search,
    ChevronDown,
    Check,
    MoreVertical,
    Eye,
    Forward,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Calendar,
  };
  private ordersService = inject(OrdersService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  searchControl = new FormControl("", { nonNullable: true });

  orders: Order[] = [];
  filteredOrders: Order[] = [];
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
  ];

  // ... (existing code)

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
      default: return "#94a3b8";
    }
  }

  // ... (existing code)

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
    "Last 7 Days",
    "Last 30 Days",
    "This Year",
    "All Time",
  ];

  selectedStatus: OrdersQueryParams["status"] = "All";
  selectedDateRange: OrdersQueryParams["dateRange"] = "Last 30 Days";

  statusMenuOpen = false;
  dateMenuOpen = false;
  actionMenuOpenId: number | null = null;

  selectedOrderIds = new Set<number>();

  stats: OrderStats = {
    totalOrders: 0,
    processing: 0,
    totalRevenue: 0,
    refundRequests: 0,
  };

  avatarStyles = [
    "bg-orange-100 text-orange-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-gray-200 text-gray-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
  ];

  ngOnInit(): void {
    this.loadOrders();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:click")
  closeMenus(): void {
    this.statusMenuOpen = false;
    this.dateMenuOpen = false;
    this.actionMenuOpenId = null;
  }

  @HostListener("document:keydown.escape")
  handleEscape(): void {
    this.statusMenuOpen = false;
    this.dateMenuOpen = false;
    this.actionMenuOpenId = null;
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

  setDateRange(range: OrdersQueryParams["dateRange"], event: Event): void {
    event.stopPropagation();
    this.selectedDateRange = range;
    this.dateMenuOpen = false;
    this.page = 1;
    this.loadOrders();
  }

  showMoreFilters(event: Event): void {
    event.stopPropagation();
    window.alert("More filters coming soon.");
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
      this.ordersService.updateStatus(order.id, nextStatus).subscribe(() => {
        this.loadOrders(false);
      });
    }
    this.actionMenuOpenId = null;
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();
    const shouldCancel = window.confirm("Cancel this order?");
    if (shouldCancel) {
      this.ordersService.updateStatus(order.id, "Cancelled").subscribe(() => {
        this.loadOrders(false);
      });
    }
    this.actionMenuOpenId = null;
  }

  exportOrders(): void {
    this.ordersService.exportOrders(this.buildParams()).subscribe((csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "orders-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  printOrders(): void {
    this.ordersService.print();
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
    return {
      searchTerm: this.searchControl.value,
      status: this.selectedStatus,
      dateRange: this.selectedDateRange,
      page: this.page,
      pageSize: this.pageSize,
    };
  }

  loadOrders(resetSelection = true): void {
    const params = this.buildParams();
    this.isLoading = true;
    this.ordersService
      .getOrders(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orders = data.items;
          this.totalResults = data.total;
          if (resetSelection) {
            this.selectedOrderIds.clear();
          }
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
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
