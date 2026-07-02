import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../../../../../../shared/components/app-icon/app-icon.component';
import { RichTextEditorComponent } from '../../../../../../shared/components/rich-text-editor/rich-text-editor.component';
import { LandingSection, CustomField, CustomFieldType } from '../../../../../../core/models/landing-page';

@Component({
  selector: 'app-custom-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, RichTextEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './custom-section-editor.component.html',
  styleUrl: './custom-section-editor.component.css'
})
export class CustomSectionEditorComponent {
  @Input({ required: true }) section!: LandingSection;
  @Output() change = new EventEmitter<void>();

  newImageUrl = '';

  getField(key: string): CustomField | undefined {
    return this.section.customFields?.find(f => f.key === key);
  }

  updateFieldValue(key: string, value: any): void {
    const field = this.getField(key);
    if (field) {
      field.value = value;
      this.change.emit();
    }
  }

  toggleField(key: string): void {
    const field = this.getField(key);
    if (field) {
      field.enabled = !field.enabled;
      this.change.emit();
    }
  }

  updateFieldLabel(key: string, label: string): void {
    const field = this.getField(key);
    if (field) {
      field.label = label;
      this.change.emit();
    }
  }

  addImageUrl(): void {
    if (!this.newImageUrl.trim()) return;
    const field = this.getField('images');
    if (field && Array.isArray(field.value)) {
      field.value = [...field.value, this.newImageUrl.trim()];
      this.newImageUrl = '';
      this.change.emit();
    }
  }

  removeImageUrl(index: number): void {
    const field = this.getField('images');
    if (field && Array.isArray(field.value)) {
      field.value = field.value.filter((_: string, i: number) => i !== index);
      this.change.emit();
    }
  }

  updateImageAt(index: number, url: string): void {
    const field = this.getField('images');
    if (field && Array.isArray(field.value)) {
      field.value = field.value.map((v: string, i: number) => i === index ? url : v);
      this.change.emit();
    }
  }

  updateLabel(label: string): void {
    this.section.label = label;
    this.change.emit();
  }

  isImagesField(field: CustomField): boolean {
    return field.type === 'images' && Array.isArray(field.value);
  }
}
