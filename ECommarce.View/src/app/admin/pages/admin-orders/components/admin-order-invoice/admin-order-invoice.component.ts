import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter, OnInit, inject } from "@angular/core";
import { OrderDetail } from "../../../../models/orders.models";
import { AdminSettings } from "../../../../models/settings.models";
import { SettingsService } from "../../../../services/settings.service";
import { ImageUrlService } from "../../../../../core/services/image-url.service";
import { PriceDisplayComponent } from "../../../../../shared/components/price-display/price-display.component";
import { AppIconComponent } from "../../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-admin-order-invoice",
  standalone: true,
  imports: [CommonModule, PriceDisplayComponent, AppIconComponent],
  templateUrl: "./admin-order-invoice.component.html",
  styleUrl: "./admin-order-invoice.component.css",
})
export class AdminOrderInvoiceComponent implements OnInit {
  @Input({ required: true }) order!: OrderDetail;
  @Output() close = new EventEmitter<void>();

  private settingsService = inject(SettingsService);
  public imageUrlService = inject(ImageUrlService);
  
  settings: AdminSettings | null = null;
  logoUrl: string | null = null;
  currentDate = new Date();

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((settings) => {
      this.settings = settings;
      if (settings.logoUrl) {
        this.logoUrl = this.imageUrlService.getImageUrl(settings.logoUrl);
      }
    });
  }

  getBarcodeUrl(text: string): string {
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${text}&scale=2&rotate=N&includetext`;
  }

  printInvoice(): void {
    window.print();
  }
}
