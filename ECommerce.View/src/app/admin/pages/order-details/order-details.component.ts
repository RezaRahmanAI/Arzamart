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
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800/50";
      case "Confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/50";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800/50";
      case "Shipped":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/50";
      case "Delivered":
        return "bg-accent/40 text-primary border-primary/20 dark:bg-accent/20 dark:text-accent dark:border-accent/30";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/50";
      case "Refund":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/50";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case "Pending":
        return "#f59e0b";
      case "Confirmed":
        return "#10b981";
      case "Processing":
        return "#eab308";
      case "Shipped":
        return "#3b82f6";
      case "Delivered":
        return "#6366f1";
      case "Cancelled":
        return "#ef4444";
      case "Refund":
        return "#f43f5e";
      default:
        return "#9ca3af";
    }
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
