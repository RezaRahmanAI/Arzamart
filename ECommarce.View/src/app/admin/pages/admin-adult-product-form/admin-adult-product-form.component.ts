import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { AdultProductService } from "../../../features/adult-landing/services/adult-product.service";
import { AdultProduct, AdultProductCreateUpdatePayload } from '../../models/adult-product.models';
import { ProductsService } from "../../services/products.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  ChevronLeft,
  Check,
  Upload,
  X,
  Type,
  PlusCircle,
  FileText,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eraser,
  Link
} from "lucide-angular";

@Component({
  selector: "app-admin-adult-product-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-adult-product-form.component.html",
})
export class AdminAdultProductFormComponent implements OnInit {
  readonly icons = {
    ChevronLeft,
    Check,
    Upload,
    X,
    Type,
    PlusCircle,
    FileText,
    AlertCircle,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Eraser,
    Link
  };

  private fb = inject(FormBuilder);
  private adultProductService = inject(AdultProductService);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly imageUrlService = inject(ImageUrlService);

  isEditMode = false;
  productId: number | null = null;
  isLoading = false;
  isSaving = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  form = this.fb.group({
    headline: ["", [Validators.required, Validators.minLength(3)]],
    slug: ["", [Validators.required, Validators.minLength(3)]],
    subtitle: [""],
    imgUrl: ["", [Validators.required]],
    benefitsTitle: ["Key Benefits"],
    benefitsContent: [""],
    sideEffectsTitle: ["Side Effects"],
    sideEffectsContent: [""],
    usageTitle: ["How to Use"],
    usageContent: [""],
    price: [0, [Validators.required, Validators.min(0)]],
    compareAtPrice: [null as number | null, [Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditMode = true;
      this.productId = Number(id);
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.adultProductService.getById(id).subscribe({
      next: (product) => {
        this.form.patchValue(product);
        if (product.imgUrl) {
          this.imagePreview = this.imageUrlService.getImageUrl(product.imgUrl);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void this.router.navigate(["/admin/adult-products"]);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
      
      // Clear the imgUrl field until uploaded OR we can just keep the old one if editing
      // But we'll mark the form as dirty
      this.form.get('imgUrl')?.setValue('selected');
      this.form.get('imgUrl')?.markAsDirty();
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.form.get('imgUrl')?.setValue('');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    if (this.selectedFile) {
      // Use existing pattern: upload file first
      this.productsService.uploadProductMedia([this.selectedFile]).subscribe({
        next: (urls: string[]) => {
          if (urls.length > 0) {
            this.form.patchValue({ imgUrl: urls[0] });
          }
          this.submitForm();
        },
        error: (err: any) => {
          console.error("Upload error:", err);
          this.isSaving = false;
          alert("Failed to upload image. Please try again.");
        }
      });
    } else {
      this.submitForm();
    }
  }

  applyFormatting(type: string, fieldName: string, textarea: HTMLTextAreaElement): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const fullText = textarea.value;

    let replacement = "";
    switch (type) {
      case "bold":
        replacement = `<b>${selectedText}</b>`;
        break;
      case "italic":
        replacement = `<i>${selectedText}</i>`;
        break;
      case "underline":
        replacement = `<u>${selectedText}</u>`;
        break;
      case "list":
        replacement = `\n<ul>\n  <li>${selectedText || "Item"}</li>\n</ul>`;
        break;
      case "ordered-list":
        replacement = `\n<ol>\n  <li>${selectedText || "Item"}</li>\n</ol>`;
        break;
      case "clear":
        replacement = selectedText.replace(/<[^>]*>/g, "");
        break;
    }

    const newValue =
      fullText.substring(0, start) + replacement + fullText.substring(end);
    
    const patchObj: any = {};
    patchObj[fieldName] = newValue;
    this.form.patchValue(patchObj);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 0);
  }

  private submitForm(): void {
    const rawValue = this.form.getRawValue();
    const payload: AdultProductCreateUpdatePayload = {
      headline: rawValue.headline ?? '',
      slug: rawValue.slug ?? '',
      subtitle: rawValue.subtitle ?? '',
      imgUrl: rawValue.imgUrl ?? '',
      benefitsTitle: rawValue.benefitsTitle ?? '',
      benefitsContent: rawValue.benefitsContent ?? '',
      sideEffectsTitle: rawValue.sideEffectsTitle ?? '',
      sideEffectsContent: rawValue.sideEffectsContent ?? '',
      usageTitle: rawValue.usageTitle ?? '',
      usageContent: rawValue.usageContent ?? '',
      price: Number(rawValue.price),
      compareAtPrice: rawValue.compareAtPrice ? Number(rawValue.compareAtPrice) : undefined,
      isActive: Boolean(rawValue.isActive)
    };
    
    if (this.isEditMode && this.productId) {
      this.adultProductService.update(this.productId, payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    } else {
      this.adultProductService.create(payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleSuccess(): void {
    this.isSaving = false;
    void this.router.navigate(["/admin/adult-products"]);
  }

  private handleError(err: any): void {
    console.error("Save error:", err);
    this.isSaving = false;
    alert("Failed to save product details.");
  }
}
