import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { Product } from "../../../core/models/product";
import { ProductCardComponent } from "../product-card/product-card.component";

@Component({
  selector: "app-product-grid",
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: "./product-grid.component.html",
  styleUrl: "./product-grid.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  @Input() products: Product[] | null = [];
}
