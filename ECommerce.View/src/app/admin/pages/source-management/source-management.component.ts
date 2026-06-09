import { NgIf, NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { SourceManagementService } from "../../../core/services/source-management.service";
import { SocialMediaSource, SourcePage } from "../../../core/models/order-source";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-admin-source-management",
  standalone: true,
  imports: [NgIf, NgClass, ReactiveFormsModule, AppIconComponent, NgFor],
  templateUrl: "./source-management.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceManagementComponent implements OnInit, OnDestroy {
  private sourceService = inject(SourceManagementService);
  private fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);

  activeTab: "pages" | "social" = "pages";
  sourcePages: SourcePage[] = [];
  socialMediaSources: SocialMediaSource[] = [];
  
  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  isSubmitting = false;
  isLoading = false;

  sourceForm = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    if (this.activeTab === "pages") {
      this.sourceService.getAllSourcePages()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (pages) => {
            this.sourcePages = pages;
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
    } else {
      this.sourceService.getAllSocialMediaSources()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (sources) => {
            this.socialMediaSources = sources;
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
    }
  }

  switchTab(tab: "pages" | "social"): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.loadData();
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.sourceForm.reset({
      name: "",
      isActive: true,
    });
    this.isModalOpen = true;
  }

  openEditModal(item: any): void {
    this.isEditing = true;
    this.selectedId = item.id;
    this.sourceForm.patchValue({
      name: item.name,
      isActive: item.isActive,
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.sourceForm.invalid) {
      this.sourceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();
    const formData: any = this.sourceForm.value;

    if (this.activeTab === "pages") {
      if (this.isEditing && this.selectedId) {
        this.sourceService.updateSourcePage(this.selectedId, formData).subscribe({
          next: () => this.handleSuccess(),
          error: () => {
            this.isSubmitting = false;
            this.cdr.markForCheck();
          },
        });
      } else {
        this.sourceService.createSourcePage(formData).subscribe({
          next: () => this.handleSuccess(),
          error: () => {
            this.isSubmitting = false;
            this.cdr.markForCheck();
          },
        });
      }
    } else {
      if (this.isEditing && this.selectedId) {
        this.sourceService.updateSocialMediaSource(this.selectedId, formData).subscribe({
          next: () => this.handleSuccess(),
          error: () => {
            this.isSubmitting = false;
            this.cdr.markForCheck();
          },
        });
      } else {
        this.sourceService.createSocialMediaSource(formData).subscribe({
          next: () => this.handleSuccess(),
          error: () => {
            this.isSubmitting = false;
            this.cdr.markForCheck();
          },
        });
      }
    }
  }

  private handleSuccess(): void {
    this.isSubmitting = false;
    this.isModalOpen = false;
    this.loadData();
  }

  deleteItem(id: number): void {
    if (confirm(`Are you sure you want to delete this ${this.activeTab === "pages" ? "page" : "social media source"}?`)) {
      if (this.activeTab === "pages") {
        this.sourceService.deleteSourcePage(id).subscribe({
          next: () => this.loadData(),
          error: () => this.cdr.markForCheck()
        });
      } else {
        this.sourceService.deleteSocialMediaSource(id).subscribe({
          next: () => this.loadData(),
          error: () => this.cdr.markForCheck()
        });
      }
    }
  }
}

