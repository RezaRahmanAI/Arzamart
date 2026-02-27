import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged } from "rxjs";
import {
  AdminCustomersService,
  Customer,
} from "../../services/admin-customers.service";
import {
  LucideAngularModule,
  Search,
  Download,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
} from "lucide-angular";

@Component({
  selector: "app-admin-customers",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-customers.component.html",
})
export class AdminCustomersComponent implements OnInit {
  readonly icons = {
    Search,
    Download,
    ShieldAlert,
    Users,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Eye,
  };
  private customersService = inject(AdminCustomersService);

  searchControl = new FormControl("", { nonNullable: true });
  customers: Customer[] = [];
  totalResults = 0;
  page = 1;
  pageSize = 10;
  isLoading = false;

  ngOnInit(): void {
    this.loadCustomers();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1;
        this.loadCustomers();
      });
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customersService
      .getCustomers({
        searchTerm: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (data) => {
          this.customers = data.items;
          this.totalResults = data.total;
          this.isLoading = false;
        },
        error: (err) => {
          console.error("Failed to load customers", err);
          this.isLoading = false;
        },
      });
  }

  get paginationStart(): number {
    if (this.totalResults === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalResults);
  }

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize) || 1;
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadCustomers();
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadCustomers();
    }
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  toggleSuspicious(customer: Customer): void {
    const action = customer.isSuspicious
      ? this.customersService.unflagCustomer(customer.id)
      : this.customersService.flagCustomer(customer.id);

    action.subscribe({
      next: () => {
        customer.isSuspicious = !customer.isSuspicious;
      },
      error: (err) => {
        console.error("Failed to toggle suspicious status", err);
      },
    });
  }
}
