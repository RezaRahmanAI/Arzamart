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
  LucideAngularModule,
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
  Plus,
  PackagePlus,
  Edit,
  ClipboardList,
  MessageSquare,
  History,
  StickyNote,
  LogOut,
  Send,
  MessageCircle,
  X,
  Loader2,
  PackageX,
  User,
  ShoppingCart,
  PlusCircle,
  Clock,
  CheckCircle,
  Truck,
  RotateCw,
  AlertCircle,
  ArrowRightCircle,
  AlertTriangle,
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
    FormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./admin-orders.component.html",
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  readonly icons = {
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
    Plus,
    PackagePlus,
    Edit,
    ClipboardList,
    MessageSquare,
    History,
    StickyNote,
    LogOut,
    Send,
    MessageCircle,
    X,
    Loader2,
    PackageX,
    User,
    ShoppingCart,
    PlusCircle,
    Clock,
    CheckCircle,
    Truck,
    RotateCw,
    AlertCircle,
    ArrowRightCircle,
    AlertTriangle,
  };
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
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

  getStatusIcon(status: string): any {
    switch (status) {
      case "Pending": return this.icons.Clock;
      case "Confirmed": return this.icons.CheckCircle;
      case "Processing": return this.icons.RotateCw;
      case "Packed": return this.icons.Package;
      case "Shipped": return this.icons.Truck;
      case "Delivered": return this.icons.CheckCircle;
      case "Cancelled": return this.icons.XCircle;
      case "Hold": return this.icons.AlertTriangle;
      case "Refund": return this.icons.RotateCcw;
      case "PreOrder": return this.icons.ArrowRightCircle;
      case "Return":
      case "ReturnProcess":
        return this.icons.AlertCircle;
      default: return this.icons.Package;
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

  statusMenuOpen = false;
  dateMenuOpen = false;
  statusUpdateOrderId: number | null = null;
  actionMenuOpenId: number | null = null;
  isPreOrderMode = false;

  selectedOrderIds = new Set<number>();

  stats: OrderStats = {
    totalOrders: 0,
    processing: 0,
    totalRevenue: 0,
    refundRequests: 0,
  };

  // Modals state
  trackingOrder: Order | null = null;
  notesOrder: Order | null = null;
  isTrackingModalOpen = false;
  isNotesModalOpen = false;
  adminNoteControl = new FormControl("");
  newNoteText = "";
  isSavingNote = false;

  // Custom Date Range State
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
      this.loadOrders();
    });

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
        error: () => window.alert("Failed to update status")
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
        // Optionally update the order in the main list
        const index = this.orders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
      },
      error: () => {
        this.isSavingNote = false;
        window.alert("Failed to add note");
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
    const msg = `Hello ${order.customerName || 'Customer'}, your order #${order.orderNumber} is pending. Please confirm by calling this number(01725455554).`;
    window.alert("Reminder Text copied to clipboard: \n\n" + msg);
    navigator.clipboard.writeText(msg);
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
    this.router.navigate(['/admin/orders', order.id]);
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
      preOrderOnly: this.isPreOrderMode,
    };

    if (this.selectedDateRange === "Custom" && this.customStartDate && this.customEndDate) {
        params.startDate = this.customStartDate;
        params.endDate = this.customEndDate;
    }

    return params;
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
