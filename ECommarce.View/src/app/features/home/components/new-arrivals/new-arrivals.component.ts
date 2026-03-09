import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpContext } from "@angular/common/http";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SHOW_LOADING } from "../../../../core/services/loading.service";

@Component({
  selector: "app-new-arrivals",
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: "./new-arrivals.component.html",
  styleUrl: "./new-arrivals.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewArrivalsComponent {
  @Input() products: Product[] = [];

  trackByProduct(index: number, product: Product): number {
    return product.id;
  }
}
