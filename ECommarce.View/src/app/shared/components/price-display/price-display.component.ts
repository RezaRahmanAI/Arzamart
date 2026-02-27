import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

import { BdtToUsdPipe } from "../../pipes/bdt-to-usd.pipe";

@Component({
  selector: "app-price-display",
  standalone: true,
  imports: [CommonModule, BdtToUsdPipe],
  templateUrl: "./price-display.component.html",
  styleUrl: "./price-display.component.css",
  host: {
    class: "inline-flex items-center gap-2",
  },
})
export class PriceDisplayComponent {
  @Input({ required: true }) amount!: number;
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() showUsd = false;

  get iconClass(): string {
    switch (this.size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  }

  get bdtClass(): string {
    switch (this.size) {
      case "sm":
        return "text-sm font-semibold";
      case "lg":
        return "text-xl font-bold";
      default:
        return "text-base font-semibold";
    }
  }

  get usdClass(): string {
    switch (this.size) {
      case "sm":
        return "text-xs text-slate-500";
      case "lg":
        return "text-sm text-slate-500";
      default:
        return "text-xs text-slate-500";
    }
  }
}
