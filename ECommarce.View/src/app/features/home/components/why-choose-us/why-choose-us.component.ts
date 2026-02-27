import { Component } from "@angular/core";
import {
  LucideAngularModule,
  PenTool,
  CheckCircle2,
  Globe,
} from "lucide-angular";
import { inject } from "@angular/core";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-why-choose-us",
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: "./why-choose-us.component.html",
  styleUrl: "./why-choose-us.component.css",
})
export class WhyChooseUsComponent {
  readonly icons = {
    PenTool,
    CheckCircle2,
    Globe,
  };
  private settingsService = inject(SiteSettingsService);
  settings$ = this.settingsService.getSettings();
}
