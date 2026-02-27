import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NotificationService,
  ToastMessage,
} from "../../../core/services/notification.service";
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger("toastAnimation", [
      state("void", style({ transform: "translateY(20px)", opacity: 0 })),
      state("*", style({ transform: "translateY(0)", opacity: 1 })),
      transition("void => *", animate("300ms cubic-bezier(0.2, 0, 0, 1)")),
      transition(
        "* => void",
        animate(
          "300ms ease-out",
          style({ opacity: 0, transform: "translateY(10px)" }),
        ),
      ),
    ]),
  ],
  template: `
    <div
      class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <div
        *ngFor="let toast of toasts"
        @toastAnimation
        class="pointer-events-auto min-w-[300px] bg-[#1a1a1a] text-white px-6 py-4 shadow-xl flex items-center justify-between gap-4 border-l-4"
        [ngClass]="{
          'border-green-500': toast.type === 'SUCCESS',
          'border-red-500': toast.type === 'ERROR',
          'border-blue-500': toast.type === 'INFO',
          'border-yellow-500': toast.type === 'WARNING',
        }"
      >
        <div class="flex flex-col">
          <span
            class="text-[10px] uppercase tracking-widest font-bold opacity-70"
            >{{ toast.type }}</span
          >
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
        <button
          (click)="remove(toast.id)"
          class="text-white/50 hover:text-white transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class ToastComponent implements OnInit {
  notificationService = inject(NotificationService);
  toasts: ToastMessage[] = [];

  ngOnInit() {
    this.notificationService.toast$.subscribe((toast) => {
      if (toast) {
        this.add(toast);
      }
    });
  }

  add(toast: ToastMessage) {
    this.toasts.push(toast);
    setTimeout(() => this.remove(toast.id), 4000); // Auto remove after 4s
  }

  remove(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
