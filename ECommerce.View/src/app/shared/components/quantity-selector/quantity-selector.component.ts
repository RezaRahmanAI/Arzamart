import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-quantity-selector",
  standalone: true,
  imports: [],
  templateUrl: "./quantity-selector.component.html",
  styleUrl: "./quantity-selector.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantitySelectorComponent {
  @Input() quantity = 1;
  @Input() min = 1;
  @Input() max = 99;
  @Input() size: "sm" | "md" | "lg" = "md";
  @Output() quantityChange = new EventEmitter<number>();

  get sizeClasses(): string {
    switch (this.size) {
      case "sm":
        return "h-8 w-8 text-xs";
      case "lg":
        return "h-12 w-12 text-base";
      default:
        return "h-10 w-10 text-sm";
    }
  }

  get canDecrement(): boolean {
    return this.quantity > this.min;
  }

  get canIncrement(): boolean {
    return this.quantity < this.max;
  }

  decrement(): void {
    if (this.canDecrement) {
      this.quantityChange.emit(this.quantity - 1);
    }
  }

  increment(): void {
    if (this.canIncrement) {
      this.quantityChange.emit(this.quantity + 1);
    }
  }
}
