import { Component, Input } from "@angular/core";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-men-filters-sortbar",
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: "./filters-sortbar.component.html",
  styleUrl: "./filters-sortbar.component.css",
})
export class MenFiltersSortbarComponent {
  @Input() shownProducts = 0;
  @Input() totalProducts = 0;
}
