import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LucideAngularModule, X } from "lucide-angular";

@Component({
  selector: "app-size-guide",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Slide-over Panel -->
      <div
        class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-500 ease-out translate-x-0"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-8 py-6 border-b border-gray-100"
        >
          <h2 class="text-xl font-serif text-primary italic tracking-tight">
            Size Guide
          </h2>
          <button
            (click)="close.emit()"
            class="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
          >
            <lucide-icon [img]="icons.X" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-8 py-8">
          <p
            class="text-[11px] text-slate-500 uppercase tracking-widest mb-8 text-center font-medium"
          >
            Find your perfect fit
          </p>

          <!-- Unit Toggle -->
          <div class="flex justify-center mb-8">
            <div
              class="inline-flex rounded-lg border border-gray-100 p-1 bg-gray-50/50"
            >
              <button
                class="px-6 py-2 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all duration-300"
                [ngClass]="
                  unit === 'cm'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-slate-400 hover:text-slate-600'
                "
                (click)="unit = 'cm'"
              >
                CM
              </button>
              <button
                class="px-6 py-2 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all duration-300"
                [ngClass]="
                  unit === 'in'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-slate-400 hover:text-slate-600'
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
                <tr class="border-b border-gray-100">
                  <th
                    class="pb-3 text-[10px] uppercase tracking-widest font-bold text-slate-900"
                  >
                    Size
                  </th>
                  <th
                    class="pb-3 text-[10px] uppercase tracking-widest font-bold text-slate-900 text-right"
                  >
                    Chest
                  </th>
                  <th
                    class="pb-3 text-[10px] uppercase tracking-widest font-bold text-slate-900 text-right"
                  >
                    Length
                  </th>
                  <th
                    class="pb-3 text-[10px] uppercase tracking-widest font-bold text-slate-900 text-right"
                  >
                    Shoulder
                  </th>
                </tr>
              </thead>
              <tbody class="text-xs text-slate-600 font-light">
                <tr
                  *ngFor="let row of sizeData"
                  class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td class="py-4 font-bold text-slate-900">{{ row.size }}</td>
                  <td class="py-4 text-right">{{ convert(row.chest) }}</td>
                  <td class="py-4 text-right">{{ convert(row.length) }}</td>
                  <td class="py-4 text-right">{{ convert(row.shoulder) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-12 bg-gray-50 p-6 rounded-none border border-gray-100">
            <h4
              class="text-[10px] uppercase tracking-widest font-bold text-slate-900 mb-2"
            >
              How to measure
            </h4>
            <div
              class="space-y-3 text-[11px] text-slate-500 leading-relaxed font-light"
            >
              <p>
                <span class="font-medium text-slate-700">Chest:</span> Measure
                around the fullest part of your chest, keeping the tape
                horizontal.
              </p>
              <p>
                <span class="font-medium text-slate-700">Length:</span> Measure
                from the highest point of the shoulder down to the hem.
              </p>
              <p>
                <span class="font-medium text-slate-700">Shoulder:</span>
                Measure across the back from shoulder tip to shoulder tip.
              </p>
            </div>
          </div>
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
export class SizeGuideComponent {
  readonly icons = {
    X,
  };
  @Output() close = new EventEmitter<void>();

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
}
