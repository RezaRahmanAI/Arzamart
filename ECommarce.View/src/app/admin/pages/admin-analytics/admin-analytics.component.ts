import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  AdminAnalyticsService,
  CustomerGrowth,
  SalesData,
  StatusDistribution,
  TopProduct,
} from "../../services/admin-analytics.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";

@Component({
  selector: "app-admin-analytics",
  standalone: true,
  imports: [CommonModule, FormsModule, PriceDisplayComponent],
  templateUrl: "./admin-analytics.component.html",
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  readonly imageUrlService = inject(ImageUrlService);

  readonly periods: ("week" | "month" | "year")[] = ["week", "month", "year"];
  salesPeriod: "week" | "month" | "year" = "month";
  salesData: SalesData[] = [];
  statusDistribution: StatusDistribution[] = [];
  customerGrowth: CustomerGrowth[] = [];
  topProducts: TopProduct[] = [];
  isLoading = true;

  // properties for sales chart
  maxSalesAmount = 0;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    // Load all data in parallel
    // In a real app we might use forkJoin but independent subscriptions are fine here

    this.loadSalesData();

    this.analyticsService.getOrderStatusDistribution().subscribe((data) => {
      this.statusDistribution = data;
    });

    this.analyticsService.getCustomerGrowth().subscribe((data) => {
      this.customerGrowth = data;
    });

    this.analyticsService.getTopProducts().subscribe((data) => {
      this.topProducts = data;
      this.isLoading = false; // Rough estimation of "done"
    });
  }

  loadSalesData(): void {
    this.analyticsService.getSalesData(this.salesPeriod).subscribe((data) => {
      this.salesData = data;
      this.maxSalesAmount = Math.max(...data.map((d) => d.amount), 1);
    });
  }

  onPeriodChange(period: "week" | "month" | "year"): void {
    this.salesPeriod = period;
    this.loadSalesData();
  }

  // Helper for simple bar chart height
  getBarHeight(amount: number): string {
    const percentage = (amount / this.maxSalesAmount) * 100;
    return `${Math.max(percentage, 2)}%`;
  }
}
