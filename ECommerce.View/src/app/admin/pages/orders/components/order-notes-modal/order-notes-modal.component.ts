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
    <div *ngIf="isOpen && order" class="fixed inset-0 z-[200] flex items-center justify-center p-ds-4 bg-ds-bg/80 backdrop-blur-md animate-in fade-in duration-300" (click)="close.emit()">
      <div class="bg-ds-surface border border-ds-border rounded-sm w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-base" (click)="$event.stopPropagation()">
        <div class="bg-ds-text p-ds-6 flex items-center justify-between text-ds-surface">
          <div>
            <p class="opacity-60 mb-1">Notes</p>
            <h3>Order Notes — {{ order.orderNumber }}</h3>
          </div>
          <button (click)="close.emit()" class="size-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-sm">
            <app-icon name="X" size="20"></app-icon>
          </button>
        </div>

        <div class="p-ds-8 flex flex-col gap-ds-6">
          <div class="space-y-3">
            <label class="text-ds-text ml-1">Add Note</label>
            <div class="relative">
              <textarea
                [(ngModel)]="newNoteText"
                rows="3"
                class="form-textarea !p-ds-4 bg-ds-bg/30"
                placeholder="Write a note..."></textarea>
              <button
                (click)="addNote()"
                [disabled]="isSaving || !newNoteText.trim()"
                class="absolute bottom-3 right-3 btn btn-primary !h-8 px-ds-4">
                <app-icon *ngIf="isSaving" name="Loader2" size="12" className="animate-spin mr-1.5"></app-icon>
                <span>Add Note</span>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-ds-text-muted border-b border-ds-border pb-2">All Notes</p>
            <div class="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-ds-8 gap-ds-2">
                <app-icon name="Loader2" size="20" className="animate-spin text-ds-text-muted"></app-icon>
                <p class="text-xs text-ds-text-muted">Loading notes...</p>
              </div>
              <ng-container *ngIf="!isLoading">
                <div *ngFor="let note of order?.notes; trackBy: trackByNoteId" class="p-ds-4 bg-ds-bg/50 border border-ds-border rounded-sm relative group">
                  <p class="text-ds-text">{{ note.content }}</p>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-ds-text-muted">{{ note.createdAt | date: 'MMM d, h:mm a' }}</span>
                    <span class="text-ds-accent">{{ note.adminName }}</span>
                  </div>
                </div>

                <div *ngIf="!order?.notes || order?.notes?.length === 0" class="py-ds-8 text-center">
                  <p class="text-ds-text-muted opacity-40">No notes yet.</p>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <div class="p-ds-6 bg-ds-bg border-t border-ds-border flex justify-end">
          <button (click)="close.emit()" class="btn btn-secondary !h-10 !px-ds-8">Close</button>
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
