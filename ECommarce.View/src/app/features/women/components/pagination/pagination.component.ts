import { Component } from "@angular/core";
import { LucideAngularModule, ChevronLeft, ChevronRight } from "lucide-angular";

@Component({
  selector: "app-women-pagination",
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: "./pagination.component.html",
  styleUrl: "./pagination.component.css",
})
export class WomenPaginationComponent {
  readonly icons = {
    ChevronLeft,
    ChevronRight,
  };
}
