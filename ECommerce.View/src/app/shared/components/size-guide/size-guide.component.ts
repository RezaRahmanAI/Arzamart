import { Component, EventEmitter, Output, OnInit, inject, Input } from "@angular/core";
import { AsyncPipe, NgClass } from "@angular/common";
import { SiteSettingsService } from "../../../core/services/site-settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { map } from "rxjs";

@Component({
  selector: "app-size-guide",
  standalone: true,
  imports: [AsyncPipe, NgClass, AppIconComponent],
  template: `
    <div
      class="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-ds-bg/40 backdrop-blur-sm transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Slide-over Panel -->
      <div
        class="relative w-full max-w-md bg-ds-bg h-full shadow-2xl flex flex-col transform transition-transform duration-500 ease-out translate-x-0"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-8 py-6 border-b border-ds-border"
        >
          <h2 class="text-primary">
            Size Guide
          </h2>
          <button
            (click)="close.emit()"
            class="p-2 text-ds-text-muted hover:text-ds-danger transition-colors rounded-full hover:bg-ds-danger-bg"
          >
            <app-icon name="X" size="20"></app-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-8 py-8">
          <p
            class="text-ds-text-muted mb-8 text-center"
          >
            {{
              customImageUrl || (settings$ | async)?.sizeGuideImageUrl
                ? "Reference Chart"
                : "Find your perfect fit"
            }}
          </p>

          <!-- Product Specific Image -->
          @if (customImageUrl) {
            <div class="mb-10 group">
              <div class="rounded-xl overflow-hidden border border-ds-border shadow-sm bg-ds-surface/30">
                <img
                  [src]="getImageUrl(customImageUrl)"
                  alt="Product Size Chart"
                  class="w-full h-auto object-contain"
                />
              </div>
              <p class="mt-4 text-ds-text-muted text-center">
                * This chart is specifically for this product.
              </p>
            </div>
          } @else {
            @if ((settings$ | async)?.sizeGuideImageUrl; as globalImageUrl) {
              <div class="mb-10 group">
                <div class="rounded-xl overflow-hidden border border-ds-border shadow-sm bg-ds-surface/30">
                  <img
                    [src]="getImageUrl(globalImageUrl)"
                    alt="Global Size Guide"
                    class="w-full h-auto object-contain"
                  />
                </div>
                <p class="mt-4 text-ds-text-muted text-center">
                  * Measurements shown in the image are for reference.
                </p>
              </div>
            } @else {
              <!-- Unit Toggle -->
              <div class="flex justify-center mb-8">
                <div
                  class="inline-flex rounded-lg border border-ds-border p-1 bg-ds-surface/50"
                >
                  <button
                    class="px-6 py-2 rounded-md transition-all duration-300"
                    [ngClass]="
                      unit === 'cm'
                        ? 'bg-ds-surface shadow-sm text-primary'
                        : 'text-ds-text-muted hover:text-ds-text-secondary'
                    "
                    (click)="unit = 'cm'"
                  >
                    CM
                  </button>
                  <button
                    class="px-6 py-2 rounded-md transition-all duration-300"
                    [ngClass]="
                      unit === 'in'
                        ? 'bg-ds-surface shadow-sm text-primary'
                        : 'text-ds-text-muted hover:text-ds-text-secondary'
                    "
                    (click)="unit = 'in'"
                  >
                    Inches
                  </button>
                </div>
              </div>

              <!-- Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-center">
                  <thead>
                    <tr class="border-b border-ds-border">
                      <th
                        class="pb-3 text-ds-text"
                      >
                        Size
                      </th>
                      <th
                        class="pb-3 text-ds-text text-right"
                      >
                        Chest
                      </th>
                      <th
                        class="pb-3 text-ds-text text-right"
                      >
                        Length
                      </th>
                      <th
                        class="pb-3 text-ds-text text-right"
                      >
                        Shoulder
                      </th>
                    </tr>
                  </thead>
                  <tbody class="text-ds-text-secondary">
                    @for (row of sizeData; track row.size) {
                      <tr
                        class="border-b border-ds-border last:border-0 hover:bg-ds-surface/50 transition-colors"
                      >
                        <td class="py-4 text-ds-text">
                          {{ row.size }}
                        </td>
                        <td class="py-4 text-right">{{ convert(row.chest) }}</td>
                        <td class="py-4 text-right">{{ convert(row.length) }}</td>
                        <td class="py-4 text-right">{{ convert(row.shoulder) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div
                class="mt-12 bg-ds-surface p-6 rounded-none border border-ds-border"
              >
                <h4
                  class="text-ds-text mb-2"
                >
                  How to measure
                </h4>
                <div
                  class="space-y-3 text-ds-text-muted"
                >
                  <p>
                    <span class="text-ds-text">Chest:</span> Measure
                    around the fullest part of your chest, keeping the tape
                    horizontal.
                  </p>
                  <p>
                    <span class="text-ds-text">Length:</span>
                    Measure from the highest point of the shoulder down to the
                    hem.
                  </p>
                  <p>
                    <span class="text-ds-text">Shoulder:</span>
                    Measure across the back from shoulder tip to shoulder tip.
                  </p>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SizeGuideComponent implements OnInit {
  @Input() customImageUrl: string | null = null;
  @Output() close = new EventEmitter<void>();

  private settingsService = inject(SiteSettingsService);
  private imageUrlService = inject(ImageUrlService);
  settings$ = this.settingsService.getSettings();

  unit: "cm" | "in" = "in";

  // Example Data for Men's Panjabi
  sizeData = [
    { size: "S", chest: 40, length: 40, shoulder: 17.5 },
    { size: "M", chest: 42, length: 42, shoulder: 18 },
    { size: "L", chest: 44, length: 44, shoulder: 18.5 },
    { size: "XL", chest: 46, length: 45, shoulder: 19 },
    { size: "XXL", chest: 48, length: 46, shoulder: 19.5 },
  ];

  convert(val: number): string {
    if (this.unit === "cm") {
      return (val * 2.54).toFixed(1);
    }
    return val.toString();
  }

  getImageUrl(path: string): string {
    return this.imageUrlService.getImageUrl(path);
  }

  ngOnInit(): void {}
}
