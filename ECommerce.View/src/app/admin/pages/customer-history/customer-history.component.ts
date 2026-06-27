import { NgIf, NgStyle, DatePipe, NgFor } from '@angular/common';
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
  OrderStatus,
  OrdersQueryParams,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { OrderInvoiceComponent } from "../orders/components/admin-order-invoice/order-invoice.component";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-customer-history",
  standalone: true,
  imports: [NgIf, NgStyle, DatePipe, ReactiveFormsModule, FormsModule, RouterModule, PriceDisplayComponent, AppIconComponent, OrderInvoiceComponent, NgFor],
  templateUrl: "./customer-history.component.html",
})
export class CustomerHistoryComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  isRefreshing = false;
  selectedCustomerPhone: string | null = null;
  orders: Order[] = [];
  invoiceOrder: Order | null = null;
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
  isTrackingLoading = false;
  isNotesLoading = false;
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
    const statuses: OrderStatus[] = [OrderStatus.Packed, OrderStatus.Delivered, OrderStatus.Return, OrderStatus.Cancelled, OrderStatus.Exchange];
    
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
    const map: Record<string, string> = {
      Pending: "var(--status-pending)", Confirmed: "var(--status-confirmed)",
      Processing: "var(--status-processing)", Packed: "var(--status-packed)",
      Shipped: "var(--status-shipped)", Delivered: "var(--status-delivered)",
      Cancelled: "var(--status-cancelled)", Hold: "var(--status-hold)",
      PreOrder: "var(--status-preorder)", Return: "var(--status-return)",
      ReturnProcess: "var(--status-return)", Exchange: "var(--status-preorder)",
      Refund: "var(--status-refund)",
    };
    return map[status] || "var(--status-hold)";
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
    this.isTrackingLoading = true;

    this.ordersService.getOrderById(order.id).subscribe({
      next: (details) => {
        this.trackingOrder = details;
        this.isTrackingLoading = false;
      },
      error: () => {
        this.isTrackingLoading = false;
        this.notification.error("Failed to load order history logs");
      }
    });
  }

  openNotes(order: Order, event: Event): void {
    event.stopPropagation();
    this.notesOrder = order;
    this.newNoteText = "";
    this.isNotesModalOpen = true;
    this.isNotesLoading = true;

    this.ordersService.getOrderById(order.id).subscribe({
      next: (details) => {
        this.notesOrder = details;
        this.isNotesLoading = false;
      },
      error: () => {
        this.isNotesLoading = false;
        this.notification.error("Failed to load order notes");
      }
    });
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
      this.ordersService.updateStatus(order.id, OrderStatus.PreOrder, "Moved to Pre-Order").subscribe(() => {
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
