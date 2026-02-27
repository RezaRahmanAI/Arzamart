import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WomenBreadcrumbsComponent } from '../../components/breadcrumbs/breadcrumbs.component';
import { WomenSidebarFiltersComponent } from '../../components/sidebar-filters/sidebar-filters.component';
import { WomenToolbarComponent } from '../../components/toolbar/toolbar.component';
import { WomenProductGridComponent } from '../../components/product-grid/product-grid.component';
import { WomenPaginationComponent } from '../../components/pagination/pagination.component';

@Component({
  selector: 'app-women-products-page',
  standalone: true,
  imports: [
    CommonModule,
    WomenBreadcrumbsComponent,
    WomenSidebarFiltersComponent,
    WomenToolbarComponent,
    WomenProductGridComponent,
    WomenPaginationComponent,
  ],
  templateUrl: './women-products-page.component.html',
  styleUrl: './women-products-page.component.css',
})
export class WomenProductsPageComponent {}
