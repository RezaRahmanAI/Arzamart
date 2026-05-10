import { Component } from "@angular/core";
import { inject } from "@angular/core";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";
import { AsyncPipe } from '@angular/common';
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-why-choose-us",
  standalone: true,
  imports: [AsyncPipe, AppIconComponent],
  templateUrl: "./why-choose-us.component.html",
  styleUrl: "./why-choose-us.component.css",
})
export class WhyChooseUsComponent {
  private settingsService = inject(SiteSettingsService);
  settings$ = this.settingsService.getSettings();
}
