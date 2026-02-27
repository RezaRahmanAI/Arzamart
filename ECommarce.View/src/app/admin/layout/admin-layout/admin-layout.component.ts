import { Component, inject } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { filter } from "rxjs";

import { AdminHeaderComponent } from "../admin-header/admin-header.component";
import { AdminSidebarComponent } from "../admin-sidebar/admin-sidebar.component";
import { SidebarService } from "../../services/sidebar.service";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
  ],
  templateUrl: "./admin-layout.component.html",
})
export class AdminLayoutComponent {
  protected sidebarService = inject(SidebarService);
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarService.close();
      });
  }
}
