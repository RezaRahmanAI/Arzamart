import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminPage } from "../../models/pages.models";
import { AdminPagesService } from "../../services/admin-pages.service";
import {
  LucideAngularModule,
  Plus,
  Edit,
  Trash2,
  FileText,
  X,
  Loader2,
} from "lucide-angular";

@Component({
  selector: "app-admin-pages",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-pages.component.html",
})
export class AdminPagesComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    Edit,
    Trash2,
    FileText,
    X,
    Loader2,
  };
  private pagesService = inject(AdminPagesService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  pages: AdminPage[] = [];
  isModalOpen = false;
  isEditing = false;
  selectedPageId: number | null = null;
  isSubmitting = false;

  pageForm = this.fb.group({
    title: ["", [Validators.required]],
    slug: ["", [Validators.required]],
    content: ["", [Validators.required]],
    metaTitle: [""],
    metaDescription: [""],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadPages();

    this.pageForm
      .get("title")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((title) => {
        if (!this.isEditing && title) {
          this.pageForm.patchValue({ slug: this.slugify(title) });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPages(): void {
    this.pagesService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((pages) => {
        this.pages = pages;
      });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedPageId = null;
    this.pageForm.reset({
      title: "",
      slug: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    });
    this.isModalOpen = true;
  }

  openEditModal(page: AdminPage): void {
    this.isEditing = true;
    this.selectedPageId = page.id;
    this.pageForm.patchValue({
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      isActive: page.isActive,
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.pageForm.invalid) {
      this.pageForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const pageData = this.pageForm.value as any;

    if (this.isEditing && this.selectedPageId) {
      this.pagesService.update(this.selectedPageId, pageData).subscribe({
        next: () => {
          this.loadPages();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    } else {
      this.pagesService.create(pageData).subscribe({
        next: () => {
          this.loadPages();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    }
  }

  deletePage(id: number): void {
    if (confirm("Are you sure you want to delete this page?")) {
      this.pagesService.delete(id).subscribe(() => {
        this.loadPages();
      });
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  }
}
