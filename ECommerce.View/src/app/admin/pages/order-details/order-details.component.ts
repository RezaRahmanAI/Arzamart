import { NgIf, NgClass, NgStyle, AsyncPipe, DatePipe, NgFor } from '@angular/common';
import { Component, OnInit, inject, HostListener } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Observable, switchMap, Subject, takeUntil, of } from "rxjs";
import { Order, OrderStatus } from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-admin-order-details",
  standalone: true,
  imports: [NgIf, NgClass, NgStyle, AsyncPipe, DatePipe, RouterModule, PriceDisplayComponent, AppIconComponent, FormsModule, NgFor],
  templateUrl: "./order-details.component.html",
})
export class OrderDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private ordersService = inject(OrdersService);
  readonly imageUrlService = inject(ImageUrlService);

  order$: Observable<Order> | null = null;
  statusMenuOpen = false;
  statusOptions: OrderStatus[] = [
    OrderStatus.Pending,
    OrderStatus.Confirmed,
    OrderStatus.Processing,
    OrderStatus.Shipped,
    OrderStatus.Refund,
  ];

  newNoteText = "";
  isSavingNote = false;
  currentOrder: Order | null = null;

  @HostListener("document:click")
  closeMenu(): void {
    this.statusMenuOpen = false;
  }

  toggleStatusMenu(event: Event): void {
    event.stopPropagation();
    this.statusMenuOpen = !this.statusMenuOpen;
  }

  ngOnInit(): void {
    this.order$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = Number(params.get("id"));
        return this.ordersService.getOrderById(id).pipe(
          switchMap(order => {
            this.currentOrder = order;
            return of(order);
          })
        );
      }),
    );
  }

  statusClass(status: OrderStatus): string {
    switch (status) {
      case "Pending":
        return "bg-ds-warning-bg text-ds-warning border-ds-warning/30";
      case "Confirmed":
        return "bg-ds-success-bg text-ds-success border-ds-success/30";
      case "Processing":
        return "bg-ds-warning-bg text-ds-warning border-ds-warning/30";
      case "Shipped":
        return "bg-ds-info-bg text-ds-info border-ds-info/30";
      case "Delivered":
        return "bg-accent/40 text-primary border-primary/20 dark:bg-accent/20 dark:text-accent dark:border-accent/30";
      case "Cancelled":
        return "bg-ds-danger-bg text-ds-danger border-ds-danger/30";
      case "Refund":
        return "bg-ds-danger-bg text-ds-danger border-ds-danger/30";
      default:
        return "bg-ds-surface text-ds-text border-ds-border";
    }
  }

  getStatusColor(status: OrderStatus): string {
    const map: Record<string, string> = {
      Pending: "var(--status-pending)", Confirmed: "var(--status-confirmed)",
      Processing: "var(--status-processing)", Shipped: "var(--status-shipped)",
      Delivered: "var(--status-delivered)", Cancelled: "var(--status-cancelled)",
      Refund: "var(--status-refund)",
    };
    return map[status] || "var(--status-hold)";
  }

  updateStatus(orderId: number, newStatus: OrderStatus): void {
    this.statusMenuOpen = false;
    this.ordersService
      .updateStatus(orderId, newStatus, `Status updated to ${newStatus}`)
      .subscribe(() => {
        if (this.currentOrder) {
          this.currentOrder.status = newStatus;
        }
      });
  }

  addNote(): void {
    if (!this.currentOrder || !this.newNoteText.trim()) return;
    this.isSavingNote = true;
    
    this.ordersService.addOrderNote(this.currentOrder.id, this.newNoteText.trim()).subscribe({
      next: (updatedOrder) => {
        this.currentOrder!.notes = updatedOrder.notes;
        this.newNoteText = "";
        this.isSavingNote = false;
        // The order$ observable is separate, so we manually update currentOrder 
        // which the template will see if we change how we bind notes.
        // Better yet: use an async subject or refresh the signal.
      },
      error: () => {
        this.isSavingNote = false;
        window.alert("Failed to add note");
      }
    });
  }

  getDivision(city: string | null | undefined): string {
    if (!city) return "";
    const lookupCity = city.trim();
    const divisions: Record<string, string[]> = {
      "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narsingdi", "Rajbari", "Shariatpur"],
      "Chittagong": ["Chittagong", "Cox's Bazar", "Bandarban", "Khagrachhari", "Rangamati", "Comilla", "Chandpur", "Feni", "Lakshmipur", "Noakhali", "Brahmanbaria"],
      "Mymensingh": ["Mymensingh", "Netrokona", "Sherpur", "Jamalpur"],
      "Sylhet": ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
      "Barisal": ["Barisal", "Patuakhali", "Bhola", "Pirojpur", "Jhalokati", "Barguna"],
      "Khulna": ["Khulna", "Bagerhat", "Satkhira", "Jessore", "Kushtia", "Chuadanga", "Meherpur", "Magura", "Narail", "Jhenaidah"],
      "Rajshahi": ["Rajshahi", "Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Sirajganj"],
      "Rangpur": ["Rangpur", "Dinajpur", "Kurigram", "Lalmonirhat", "Gaibandha", "Nilphamari", "Thakurgaon", "Panchagarh"]
    };

    for (const [division, cities] of Object.entries(divisions)) {
      if (cities.some(c => c.toLowerCase() === lookupCity.toLowerCase())) {
        return division;
      }
    }
    return "";
  }
}
