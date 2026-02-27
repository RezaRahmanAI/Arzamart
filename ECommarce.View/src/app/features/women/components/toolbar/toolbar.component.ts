import { Component } from "@angular/core";
import { LucideAngularModule, X, ChevronDown } from "lucide-angular";

@Component({
  selector: "app-women-toolbar",
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: "./toolbar.component.html",
  styleUrl: "./toolbar.component.css",
})
export class WomenToolbarComponent {
  readonly icons = {
    X,
    ChevronDown,
  };
}
