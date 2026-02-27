import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";

@Component({
  selector: "app-newsletter",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./newsletter.component.html",
  styleUrl: "./newsletter.component.css",
})
export class NewsletterComponent {
  private settingsService = inject(SiteSettingsService);
  settings$ = this.settingsService.getSettings();
}
