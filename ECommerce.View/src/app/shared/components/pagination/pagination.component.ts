import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { AppIconComponent } from "../app-icon/app-icon.component";

@Component({
  selector: "app-pagination",
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: "./pagination.component.html",
  styleUrl: "./pagination.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() siblingCount = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const sibling = this.siblingCount;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(current - sibling, 2);
    const right = Math.min(current + sibling, total - 1);

    const items: (number | string)[] = [1];

    if (left > 2) items.push("...");

    for (let i = left; i <= right; i++) {
      items.push(i);
    }

    if (right < total - 1) items.push("...");

    items.push(total);

    return items;
  }

  get hasPrevious(): boolean {
    return this.currentPage > 1;
  }

  get hasNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  goToPage(page: number | string): void {
    if (typeof page === "number" && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  previous(): void {
    if (this.hasPrevious) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  next(): void {
    if (this.hasNext) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}
