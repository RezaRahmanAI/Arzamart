import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LucideAngularModule, ShoppingCart } from "lucide-angular";

@Component({
  selector: "app-icon-button",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: "./icon-button.component.html",
  styleUrl: "./icon-button.component.css",
})
export class IconButtonComponent {
  readonly icons = {
    ShoppingCart,
  };
  @Input() icon: any = ShoppingCart;
  @Input() variant: "light" | "dark" = "light";
}
