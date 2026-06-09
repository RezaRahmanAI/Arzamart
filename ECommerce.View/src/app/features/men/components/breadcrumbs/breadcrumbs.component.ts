import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-men-breadcrumbs',
  standalone: true,
  imports: [ RouterModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.css',
})
export class MenBreadcrumbsComponent {}
