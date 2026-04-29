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
import { Subject, takeUntil } from "rxjs";

import {
  Order,
  OrderDetail,
  OrderStatus,
  OrdersQueryParams,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { AdminOrderInvoiceComponent } from "../admin-orders/components/admin-order-invoice/admin-order-invoice.component";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-customer-history",
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
  templateUrl: "./admin-customer-history.component.html",
})
export class AdminCustomerHistoryComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  isRefreshing = false;
  selectedCustomerPhone: string | null = null;
  orders: Order[] = [];
  invoiceOrder: OrderDetail | null = null;
  isInvoiceLoading = false;
  totalResults = 0;
  page = 1;
  pageSize = 100; // Load more for history to get better stats

  customerSummary: any[] = [];
  customerStats = {
    total: 0,
    delivered: 0,
    cancelled: 0,
    successRate: 0,
    totalPaid: 0,
    totalDue: 0,
    totalAmount: 0
  };

  trackingOrder: Order | null = null;
  notesOrder: Order | null = null;
  isTrackingModalOpen = false;
  isNotesModalOpen = false;
  newNoteText = "";
  isSavingNote = false;

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['phone']) {
        this.selectedCustomerPhone = params['phone'];
        this.loadOrders();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(forceRefresh = false): void {
    if (!this.selectedCustomerPhone) return;

    const params: OrdersQueryParams = {
      searchTerm: "",
      status: "All",
      dateRange: "All Time",
      page: this.page,
      pageSize: this.pageSize,
      customerPhone: this.selectedCustomerPhone
    };

    this.isLoading = true;
    this.ordersService.getOrders(params, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orders = data.items;
          this.totalResults = data.total;
          this.calculateCustomerStats();
          this.isLoading = false;
          this.isRefreshing = false;
        },
        error: () => {
          this.isLoading = false;
          this.isRefreshing = false;
        }
      });
  }

  calculateCustomerStats(): void {
    const statusGroups: any = {};
    const statuses: OrderStatus[] = ["Packed", "Delivered", "Return", "Cancelled", "Exchange"];
    
    statuses.forEach(s => statusGroups[s] = { count: 0, amount: 0, paid: 0, due: 0 });
    
    let totalCount = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    this.orders.forEach(order => {
      const s = order.status;
      if (!statusGroups[s]) {
        statusGroups[s] = { count: 0, amount: 0, paid: 0, due: 0 };
      }
      
      statusGroups[s].count++;
      statusGroups[s].amount += order.total;
      statusGroups[s].paid += (order as any).paidAmount || 0;
      statusGroups[s].due += (order.total - ((order as any).paidAmount || 0));

      totalCount++;
      totalAmount += order.total;
      totalPaid += (order as any).paidAmount || 0;
      totalDue += (order.total - ((order as any).paidAmount || 0));

      if (s === 'Delivered') deliveredCount++;
      if (s === 'Cancelled' || s === 'Return') cancelledCount++;
    });

    this.customerSummary = Object.keys(statusGroups).map(key => ({
      status: key,
      ...statusGroups[key]
    }));

    this.customerStats = {
      total: totalCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
      successRate: totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0,
      totalAmount,
      totalPaid,
      totalDue
    };
  }

  refreshOrders(): void {
    this.isRefreshing = true;
    this.loadOrders(true);
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

  // Action methods (copied from AdminOrders for functionality)
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
        this.notification.error("Failed to load invoice");
      }
    });
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
      },
      error: () => {
        this.isSavingNote = false;
        this.notification.error("Failed to add note");
      }
    });
  }

  sendReminder(order: Order, event: Event): void {
    event.stopPropagation();
    const phone = order.customerPhone.replace(/\D/g, '');
    const msg = `Hello ${order.customerName || 'Customer'}, your order #${order.orderNumber} is pending. Please confirm by calling 01725455554.`;
    navigator.clipboard.writeText(msg);
    window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
    this.notification.success("Reminder copied & SMS app opening...");
  }

  sendWhatsApp(order: Order, event: Event): void {
    event.stopPropagation();
    const phone = order.customerPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hello ${order.customerName}, about your order #${order.orderNumber}...`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  editOrder(order: Order, event: Event): void {
    event.stopPropagation();
    this.router.navigate(["/admin/orders", order.id, "edit"]);
  }

  moveToPreOrder(order: Order, event: Event): void {
    event.stopPropagation();
    if (window.confirm("Move this order to Pre-Order?")) {
      this.ordersService.updateStatus(order.id, "PreOrder", "Moved to Pre-Order").subscribe(() => {
        this.loadOrders();
      });
    }
  }

  getPaidAmount(order: Order): number {
    return (order as any).paidAmount || 0;
  }

  getDueAmount(order: Order): number {
    return order.total - this.getPaidAmount(order);
  }
}
