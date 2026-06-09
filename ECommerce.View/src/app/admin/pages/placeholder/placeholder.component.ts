
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  imports: [],
  templateUrl: './placeholder.component.html',
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] as string;
  description = (this.route.snapshot.data['description'] as string) ?? 'Content coming soon.';
}
