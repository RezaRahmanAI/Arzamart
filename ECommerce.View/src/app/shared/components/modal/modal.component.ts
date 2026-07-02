import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-modal",
  standalone: true,
  imports: [],
  templateUrl: "./modal.component.html",
  styleUrl: "./modal.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = "";
  @Input() size: "sm" | "md" | "lg" | "xl" = "md";
  @Output() close = new EventEmitter<void>();

  get sizeClasses(): string {
    switch (this.size) {
      case "sm":
        return "max-w-sm";
      case "lg":
        return "max-w-4xl";
      case "xl":
        return "max-w-6xl";
      default:
        return "max-w-2xl";
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.close.emit();
    }
  }

  closeDialog(): void {
    this.close.emit();
  }
}
