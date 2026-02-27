import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.css',
})
export class PlaceholderComponent implements OnInit {
  title = 'Coming Soon';
  description = 'This page will be connected to the API soon.';

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    if (data['title']) {
      this.title = data['title'];
    }
    if (data['description']) {
      this.description = data['description'];
    }
  }
}
