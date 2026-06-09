import { NgIf, NgFor, DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderItem, OrderStatus } from '../../../../models/orders.models';
import { PriceDisplayComponent } from '../../../../../shared/components/price-display/price-display.component';
import { AppIconComponent } from '../../../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, PriceDisplayComponent, AppIconComponent],
  templateUrl: './order-table.component.html',
})
export class OrderTableComponent {
  @Input() orders: Order[] = [];
  @Input() isLoading = false;
  @Input() statusClass: (status: string) => string = () => '';
  @Input() getStatusColor: (status: string) => string = () => '';
  @Input() getStatusIconName: (status: string) => string = () => '';
  @Input() getNextStatus: (status: string) => OrderStatus | null = () => null;
  @Input() nextStatusLabel: (order: Order) => string | null = () => null;
  @Input() updateStatusOptions: OrderStatus[] = [];
  @Input() statusUpdateOrderId: number | null = null;
  @Input() selectedOrderIds: Set<number> = new Set();
  @Input() actionMenuOpenId: number | null = null;
  @Input() trackingOrder: Order | null = null;
  @Input() isInvoiceLoading = false;

  @Output() statusUpdateMenuToggle = new EventEmitter<{ orderId: number; event: Event }>();
  @Output() statusUpdate = new EventEmitter<{ orderId: number; newStatus: OrderStatus; event: Event }>();
  @Output() markNextStatus = new EventEmitter<{ order: Order; event: Event }>();
  @Output() cancelOrder = new EventEmitter<{ order: Order; event: Event }>();
  @Output() editOrder = new EventEmitter<{ order: Order; event: Event }>();
  @Output() openTracking = new EventEmitter<{ order: Order; event: Event }>();
  @Output() openNotes = new EventEmitter<{ order: Order; event: Event }>();
  @Output() printInvoice = new EventEmitter<{ order: Order; event: Event }>();
  @Output() sendWhatsApp = new EventEmitter<{ order: Order; event: Event }>();
  @Output() moveToPreOrder = new EventEmitter<{ order: Order; event: Event }>();
  @Output() moveToMainOrder = new EventEmitter<{ order: Order; event: Event }>();
  @Output() sendReminder = new EventEmitter<{ order: Order; event: Event }>();
  @Output() cancelOrderClick = new EventEmitter<{ order: Order; event: Event }>();
  @Output() statusMenuToggle = new EventEmitter<{ orderId: number; event: Event }>();
  @Output() copyToClipboard = new EventEmitter<{ text: string; event: Event }>();
  @Output() toggleSelectAll = new EventEmitter<Event>();
  @Output() toggleSelectOrder = new EventEmitter<{ orderId: number; event: Event }>();
  @Output() toggleRowActions = new EventEmitter<{ orderId: number; event: Event }>();
  @Output() moveToPreOrderClick = new EventEmitter<{ order: Order; event: Event }>();
  @Output() moveToMainOrderClick = new EventEmitter<{ order: Order; event: Event }>();
  @Output() sendReminderClick = new EventEmitter<{ order: Order; event: Event }>();
  @Output() cancelOrderClickEvent = new EventEmitter<{ order: Order; event: Event }>();

  trackByOrderId(_: number, order: Order): number {
    return order.id;
  }

  trackByOrderItem(_: number, item: OrderItem): string {
    return `${item.productId}-${item.size || ''}`;
  }

  trackByStatusOption(_: number, status: string): string {
    return status;
  }

  isAllVisibleSelected(): boolean {
    return this.orders.length > 0 && this.orders.every(o => this.selectedOrderIds.has(o.id));
  }

  isIndeterminate(): boolean {
    const selectedVisible = this.orders.filter(o => this.selectedOrderIds.has(o.id));
    return selectedVisible.length > 0 && selectedVisible.length < this.orders.length;
  }
}