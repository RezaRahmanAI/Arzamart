import { Component, Input } from "@angular/core";
import { LucideAngularModule, Sliders, ChevronDown } from "lucide-angular";

@Component({
  selector: "app-men-filters-sortbar",
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: "./filters-sortbar.component.html",
  styleUrl: "./filters-sortbar.component.css",
})
export class MenFiltersSortbarComponent {
  readonly icons = {
    Sliders,
    ChevronDown,
  };
  @Input() shownProducts = 0;
  @Input() totalProducts = 0;
}
