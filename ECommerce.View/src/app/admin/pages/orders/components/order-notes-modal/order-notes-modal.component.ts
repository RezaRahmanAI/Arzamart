import { NgIf, NgFor, DatePipe } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Order, OrderNote } from "../../../../models/orders.models";
import { OrdersService } from "../../../../services/orders.service";
import { AppIconComponent } from "../../../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../../../core/services/notification.service";

@Component({
  selector: "app-order-notes-modal",
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule, AppIconComponent],
  template: `
    <div *ngIf="isOpen && order" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300" (click)="close.emit()">
      <div class="bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-200 flex flex-col w-full max-w-[400px] max-h-[90vh]" style="border-radius: var(--radius-lg)" (click)="$event.stopPropagation()">

        <!-- Header -->
        <header class="flex items-center justify-between px-4 h-10 bg-white border-b border-gray-200 shrink-0" style="border-radius: var(--radius-lg) var(--radius-lg) 0 0">
          <button (click)="close.emit()" class="hover:bg-gray-100 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center text-gray-500">
            <app-icon name="X" size="18"></app-icon>
          </button>
          <h1 class="text-base font-semibold text-gray-900">Order Notes</h1>
          <div class="w-10"></div>
        </header>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto p-2 space-y-2">

          <!-- Add Note Section -->
          <section class="space-y-1">
            <textarea
              [(ngModel)]="newNoteText"
              rows="2"
              class="w-full bg-white border border-gray-200 p-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all resize-none outline-none"
              style="border-radius: var(--radius-sm)"
              placeholder="Add a note..."></textarea>
            <div class="flex justify-end">
              <button
                (click)="addNote()"
                [disabled]="isSaving || !newNoteText.trim()"
                class="bg-gray-900 hover:bg-gray-700 text-white font-medium px-3 h-7 flex items-center justify-center transition-colors active:scale-95 duration-150 shadow-sm text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                style="border-radius: var(--radius-sm)">
                <app-icon *ngIf="isSaving" name="Loader2" size="12" className="animate-spin mr-1.5"></app-icon>
                Add Note
              </button>
            </div>
          </section>

          <!-- Divider -->
          <div class="h-px bg-gray-200 w-full"></div>

          <!-- All Notes Section -->
          <section class="space-y-1">
            <h2 class="text-xs font-medium text-gray-900">All Notes</h2>

            <!-- Loading -->
            <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-8 gap-2">
              <app-icon name="Loader2" size="20" className="animate-spin text-gray-400"></app-icon>
              <p class="text-xs text-gray-400">Loading notes...</p>
            </div>

            <!-- Notes List -->
            <div *ngIf="!isLoading" class="space-y-1">
              <article *ngFor="let note of order?.notes; trackBy: trackByNoteId"
                class="bg-white border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                style="border-radius: var(--radius-sm)">
                <p class="text-[13px] text-gray-900">{{ note.content }}</p>
                <div class="flex items-center justify-between mt-1 text-gray-500">
                  <span class="text-[11px] font-medium text-gray-900">{{ note.adminName }}</span>
                  <span class="text-[10px]">{{ note.createdAt | date: 'MMM d, h:mm a' }}</span>
                </div>
              </article>

              <!-- Empty State -->
              <div *ngIf="!order?.notes || order?.notes?.length === 0" class="py-8 text-center">
                <p class="text-gray-400 text-sm">No notes yet.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  `,
})
export class OrderNotesModalComponent {
  @Input() isOpen = false;
  @Input() order: Order | null = null;
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  @Output() noteAdded = new EventEmitter<Order>();

  private readonly ordersService = inject(OrdersService);
  private readonly notification = inject(NotificationService);

  newNoteText = "";
  isSaving = false;

  addNote(): void {
    if (!this.order || !this.newNoteText.trim()) return;
    this.isSaving = true;

    this.ordersService.addOrderNote(this.order.id, this.newNoteText.trim()).subscribe({
      next: (updatedOrder) => {
        this.order!.notes = updatedOrder.notes;
        this.newNoteText = "";
        this.isSaving = false;
        this.noteAdded.emit(updatedOrder);
      },
      error: () => {
        this.isSaving = false;
        this.notification.error("Failed to add note");
      }
    });
  }

  trackByNoteId(_: number, note: OrderNote): string {
    return note.createdAt;
  }
}
