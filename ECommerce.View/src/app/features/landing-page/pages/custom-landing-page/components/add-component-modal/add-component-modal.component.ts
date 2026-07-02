import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../../../../../../shared/components/app-icon/app-icon.component';
import { LandingSection, CustomField, LayoutType } from '../../../../../../core/models/landing-page';
import { LAYOUT_TYPES, createDefaultFields } from '../../../../../../core/constants/layout-types';
import { SECTION_ICONS } from '../../../../../../core/constants/section-icons';

@Component({
  selector: 'app-add-component-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './add-component-modal.component.html',
  styleUrl: './add-component-modal.component.css'
})
export class AddComponentModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() componentCreated = new EventEmitter<LandingSection>();

  step: 'setup' | 'layout' = 'setup';
  componentName = '';
  componentIcon = 'LayoutGrid';
  isVisible = true;
  selectedLayoutType: LayoutType | null = null;
  layoutTypes = LAYOUT_TYPES;
  availableIcons = SECTION_ICONS;

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }

  selectIcon(icon: string): void {
    this.componentIcon = icon;
  }

  selectLayoutType(type: LayoutType): void {
    this.selectedLayoutType = type;
  }

  canProceed(): boolean {
    if (this.step === 'setup') {
      return this.componentName.trim().length > 0;
    }
    return this.selectedLayoutType !== null;
  }

  goNext(): void {
    if (this.step === 'setup' && this.canProceed()) {
      this.step = 'layout';
    }
  }

  goBack(): void {
    if (this.step === 'layout') {
      this.step = 'setup';
    }
  }

  createComponent(): void {
    if (!this.selectedLayoutType || !this.componentName.trim()) return;

    const section: LandingSection = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      label: this.componentName.trim(),
      visible: this.isVisible,
      icon: this.componentIcon,
      customFields: createDefaultFields(this.selectedLayoutType)
    };

    this.componentCreated.emit(section);
    this.resetAndClose();
  }

  resetAndClose(): void {
    this.step = 'setup';
    this.componentName = '';
    this.componentIcon = 'LayoutGrid';
    this.isVisible = true;
    this.selectedLayoutType = null;
    this.close.emit();
  }
}
