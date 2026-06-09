import { ChangeDetectionStrategy, Component, OnDestroy, inject } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { NgIf } from '@angular/common';
import { Subject, filter } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { AdminHeaderComponent } from "../admin-header/admin-header.component";
import { AdminSidebarComponent } from "../admin-sidebar/admin-sidebar.component";
import { SidebarService } from "../../services/sidebar.service";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [
    NgIf,
    RouterModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
  ],
  templateUrl: "./admin-layout.component.html",
  styleUrl: "../../admin-styles.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  protected sidebarService = inject(SidebarService);
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.sidebarService.close();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
