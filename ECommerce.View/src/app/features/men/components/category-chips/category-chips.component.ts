import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-men-category-chips',
  standalone: true,
  imports: [NgClass, NgFor],
  templateUrl: './category-chips.component.html',
  styleUrl: './category-chips.component.css',
})
export class MenCategoryChipsComponent {
  categories = ['All', 'Thobes', 'Kurtas', 'Shirts', 'Pants'];
  activeCategory = 'All';
}
