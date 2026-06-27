import { NgIf, NgStyle, NgFor, DatePipe } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { Order, OrderLog } from "../../../../models/orders.models";
import { OrdersService } from "../../../../services/orders.service";
import { AppIconComponent } from "../../../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../../../core/services/notification.service";

@Component({
  selector: "app-order-tracking-modal",
  standalone: true,
  imports: [NgIf, NgStyle, NgFor, DatePipe, AppIconComponent],
  template: `
    <div *ngIf="isOpen && order" class="fixed inset-0 z-[200] flex items-center justify-center p-ds-4 bg-ds-bg/80 backdrop-blur-md animate-in fade-in duration-300" (click)="close.emit()">
      <div class="bg-ds-surface border border-ds-border rounded-sm w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-base" (click)="$event.stopPropagation()">
        <div class="bg-ds-text p-ds-6 flex items-center justify-between text-ds-surface">
          <div>
            <p class="opacity-60 mb-1">Order History</p>
            <h3>History — {{ order.orderNumber }}</h3>
          </div>
          <button (click)="close.emit()" class="size-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-sm">
            <app-icon name="X" size="20"></app-icon>
          </button>
        </div>
        <div class="p-ds-8 max-h-[500px] overflow-y-auto space-y-ds-4 custom-scrollbar">
          <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-ds-12 gap-ds-3">
            <app-icon name="Loader2" size="24" className="animate-spin text-ds-text-muted"></app-icon>
            <p class="text-xs text-ds-text-muted">Loading history logs...</p>
          </div>
          <ng-container *ngIf="!isLoading">
            <div *ngFor="let log of order?.logs; trackBy: trackByLogIndex" class="p-ds-4 bg-ds-bg border border-ds-border rounded-sm flex items-start gap-ds-4">
              <div class="size-2 mt-1.5 rounded-full shrink-0" [ngStyle]="{ backgroundColor: getStatusColor(log.statusTo) }"></div>
              <div>
                <p class="text-ds-text">{{ log.statusTo }}</p>
                <div class="flex items-center justify-between gap-4 mt-1">
                  <p class="text-ds-text-muted">{{ log.createdAt | date: 'MMM d, y — h:mm a' }}</p>
                  <span class="text-ds-accent">{{ log.changedBy }}</span>
                </div>
                <p class="mt-ds-2 text-ds-text-sec" *ngIf="log.note">"{{ log.note }}"</p>
              </div>
            </div>
            <div *ngIf="!order?.logs || order?.logs?.length === 0" class="py-ds-8 text-center text-xs text-ds-text-muted">
              No history logs available for this order.
            </div>
          </ng-container>
        </div>
        <div class="p-ds-6 bg-ds-bg border-t border-ds-border flex justify-end">
          <button (click)="close.emit()" class="btn btn-secondary !h-10 !px-ds-8">Close</button>
        </div>
      </div>
    </div>
  `,
})
export class OrderTrackingModalComponent {
  @Input() isOpen = false;
  @Input() order: Order | null = null;
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();

  private readonly ordersService = inject(OrdersService);
  private readonly notification = inject(NotificationService);

  private static readonly STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b", Confirmed: "#10b981", Processing: "#eab308",
    Packed: "#6366f1", Shipped: "#3b82f6", Delivered: "#0d4c5e",
    Cancelled: "#ef4444", Hold: "#6b7280", PreOrder: "#8b5cf6",
    Return: "#ec4899", ReturnProcess: "#ec4899", Exchange: "#8b5cf6",
    Refund: "#f43f5e",
  };

  getStatusColor(status: string): string {
    return OrderTrackingModalComponent.STATUS_COLORS[status] || "#94a3b8";
  }

  trackByLogIndex(_: number, log: OrderLog): number {
    return log.id;
  }
}
