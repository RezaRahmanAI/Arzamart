import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="arza-quill-wrapper">
      <quill-editor
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [modules]="quillModules"
        [placeholder]="placeholder"
        [style]="{ minHeight: '120px' }"
      ></quill-editor>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .arza-quill-wrapper ::ng-deep .ql-container { font-family: 'Hind Siliguri', sans-serif; font-size: 14px; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; }
    .arza-quill-wrapper ::ng-deep .ql-toolbar { border-top-left-radius: 6px; border-top-right-radius: 6px; }
    .arza-quill-wrapper ::ng-deep .ql-editor { min-height: 120px; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @Input() placeholder = 'এখানে লিখুন...';

  value = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean'],
    ]
  };

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onValueChange(html: string): void {
    this.value = html;
    this.onChange(html);
    this.onTouched();
  }
}
