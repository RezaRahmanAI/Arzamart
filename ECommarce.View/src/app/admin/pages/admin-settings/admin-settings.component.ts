import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterModule } from "@angular/router";

import {
  AdminSettings,
  ShippingZone,
  DeliveryMethod,
} from "../../models/settings.models";
import { SettingsService } from "../../services/settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-settings",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
  ],
  templateUrl: "./admin-settings.component.html",
  styleUrl: "./admin-settings.component.css",
})
export class AdminSettingsComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
  private notification = inject(NotificationService);

  @ViewChild("fileUpload") fileUpload?: ElementRef<HTMLInputElement>;

  tabs = ["General", "Shipping"];
  activeTab = "General";

  settingsForm = this.formBuilder.group({
    websiteName: ["", Validators.required],
    contactEmail: ["", [Validators.required, Validators.email]],
    contactPhone: [""],
    address: [""],
    facebookUrl: [""],
    instagramUrl: [""],
    twitterUrl: [""],
    youtubeUrl: [""],
    whatsAppNumber: [""],
    currency: ["BDT"],
    description: [""],
    freeShippingThreshold: [0],
    facebookPixelId: [""],
    googleTagId: [""],
    payments: this.formBuilder.group({
      stripeEnabled: [false],
      paypalEnabled: [false],
    }),
  });

  zoneForm = this.formBuilder.group({
    id: [0],
    name: ["", Validators.required],
    region: ["", Validators.required],
    rates: ["", Validators.required],
  });

  shippingZones: ShippingZone[] = [];
  deliveryMethods: DeliveryMethod[] = [];
  stripePublishableKey = "";
  logoPreviewUrl: string | null = null;
  logoError = "";
  sizeGuidePreviewUrl: string | null = null;
  sizeGuideError = "";
  saveMessage = "";
  saveError = "";
  isSaving = false;

  showZoneForm = false;
  editingZoneId: number | null = null;

  showDeliveryForm = false;
  editingDeliveryId: number | null = null;
  deliveryForm = this.formBuilder.group({
    id: [0],
    name: ["", Validators.required],
    cost: [0, [Validators.required, Validators.min(0)]],
    estimatedDays: [""],
    isActive: [true],
  });

  copiedKey = false;
  imageUrlService = inject(ImageUrlService);

  private lastSettings: AdminSettings | null = null;
  protected Math = Math;
  protected date = new Date();

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((settings) => {
      this.lastSettings = settings;
      this.shippingZones = settings.shippingZones || [];
      this.deliveryMethods = settings.deliveryMethods || [];
      this.stripePublishableKey = settings.stripePublishableKey || "";

      if (settings.logoUrl) {
        this.logoPreviewUrl = this.imageUrlService.getImageUrl(
          settings.logoUrl,
        );
      }

      if (settings.sizeGuideImageUrl) {
        this.sizeGuidePreviewUrl = this.imageUrlService.getImageUrl(
          settings.sizeGuideImageUrl,
        );
      }

      this.settingsForm.patchValue({
        websiteName: settings.websiteName,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        address: settings.address,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        twitterUrl: settings.twitterUrl,
        youtubeUrl: settings.youtubeUrl,
        whatsAppNumber: settings.whatsAppNumber,
        currency: settings.currency,
        description: settings.description,
        freeShippingThreshold: settings.freeShippingThreshold,
        facebookPixelId: settings.facebookPixelId,
        googleTagId: settings.googleTagId,
        payments: {
          stripeEnabled: settings.stripeEnabled || false,
          paypalEnabled: settings.paypalEnabled || false,
        },
      });
    });
  }

  get stripeEnabled(): boolean {
    return this.settingsForm.controls.payments.controls.stripeEnabled.value;
  }

  get paypalEnabled(): boolean {
    return this.settingsForm.controls.payments.controls.paypalEnabled.value;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  saveChanges(): void {
    this.saveMessage = "";

    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      const invalidFields: string[] = [];
      Object.keys(this.settingsForm.controls).forEach((key) => {
        if (this.settingsForm.get(key)?.invalid) invalidFields.push(key);
      });
      this.notification.warn(`Please fill in all required fields: ${invalidFields.join(", ")}`);
      return;
    }

    const formValue = this.settingsForm.getRawValue();
    const payload: AdminSettings = {
      websiteName: formValue.websiteName,
      logoUrl: this.lastSettings?.logoUrl,
      sizeGuideImageUrl: this.lastSettings?.sizeGuideImageUrl,
      contactEmail: formValue.contactEmail,
      contactPhone: formValue.contactPhone,
      address: formValue.address,
      facebookUrl: formValue.facebookUrl,
      instagramUrl: formValue.instagramUrl,
      twitterUrl: formValue.twitterUrl,
      youtubeUrl: formValue.youtubeUrl,
      whatsAppNumber: formValue.whatsAppNumber,
      currency: formValue.currency,
      description: formValue.description,
      freeShippingThreshold: formValue.freeShippingThreshold,
      stripeEnabled: formValue.payments.stripeEnabled,
      paypalEnabled: formValue.payments.paypalEnabled,
      stripePublishableKey: this.stripePublishableKey,
      shippingZones: [...this.shippingZones],
      deliveryMethods: [...this.deliveryMethods],
      facebookPixelId: formValue.facebookPixelId,
      googleTagId: formValue.googleTagId,
    };

    this.isSaving = true;
    this.saveMessage = "";
    this.saveError = "";

    this.settingsService.saveSettings(payload).subscribe({
      next: (settings) => {
        this.isSaving = false;
        this.notification.success("Settings saved successfully!");
        this.lastSettings = settings;
        this.shippingZones = settings.shippingZones || [];
        this.deliveryMethods = settings.deliveryMethods || [];
        setTimeout(() => (this.saveMessage = ""), 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.notification.error("Failed to save settings. Please try again.");
        console.error("Save settings failed", err);
        setTimeout(() => (this.saveError = ""), 5000);
      },
    });
  }

  resetForm(): void {
    if (!this.lastSettings) {
      return;
    }

    this.settingsForm.reset({
      websiteName: this.lastSettings.websiteName,
      contactEmail: this.lastSettings.contactEmail,
      contactPhone: this.lastSettings.contactPhone,
      address: this.lastSettings.address,
      facebookUrl: this.lastSettings.facebookUrl,
      instagramUrl: this.lastSettings.instagramUrl,
      twitterUrl: this.lastSettings.twitterUrl,
      youtubeUrl: this.lastSettings.youtubeUrl,
      whatsAppNumber: this.lastSettings.whatsAppNumber,
      currency: this.lastSettings.currency,
      description: this.lastSettings.description,
      facebookPixelId: this.lastSettings.facebookPixelId,
      googleTagId: this.lastSettings.googleTagId,
      payments: {
        stripeEnabled: this.lastSettings.stripeEnabled || false,
        paypalEnabled: this.lastSettings.paypalEnabled || false,
      },
    });

    this.shippingZones = this.lastSettings.shippingZones || [];
    this.deliveryMethods = this.lastSettings.deliveryMethods || [];
    this.stripePublishableKey = this.lastSettings.stripePublishableKey || "";
    this.saveMessage = "";
  }

  triggerLogoUpload(): void {
    this.fileUpload?.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const isValidType = ["image/png", "image/jpeg", "image/gif"].includes(
      file.type,
    );
    const isValidSize = file.size <= 2 * 1024 * 1024;

    if (!isValidType || !isValidSize) {
      this.logoError = "Please upload a PNG, JPG, or GIF file up to 2MB.";
      this.logoPreviewUrl = null;
      input.value = "";
      return;
    }

    this.logoError = "";

    this.settingsService.uploadLogo(file).subscribe({
      next: (res) => {
        if (this.lastSettings) {
          this.lastSettings.logoUrl = res.url;
        }
        this.logoPreviewUrl = this.imageUrlService.getImageUrl(res.url);
      },
      error: (err) => {
        console.error("Logo upload failed", err);
        this.logoError = "Failed to upload logo.";
      },
    });
  }

  onSizeGuideSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const isValidType = ["image/png", "image/jpeg", "image/gif"].includes(
      file.type,
    );
    const isValidSize = file.size <= 5 * 1024 * 1024;

    if (!isValidType || !isValidSize) {
      this.sizeGuideError = "Please upload a PNG, JPG, or GIF file up to 5MB.";
      this.sizeGuidePreviewUrl = null;
      input.value = "";
      return;
    }

    this.sizeGuideError = "";

    this.settingsService.uploadLogo(file).subscribe({
      next: (res) => {
        if (this.lastSettings) {
          this.lastSettings.sizeGuideImageUrl = res.url;
        }
        this.sizeGuidePreviewUrl = this.imageUrlService.getImageUrl(res.url);
      },
      error: (err) => {
        console.error("Size Guide upload failed", err);
        this.sizeGuideError = "Failed to upload Size Guide.";
      },
    });
  }

  copyStripeKey(): void {
    if (!this.stripePublishableKey) {
      return;
    }

    navigator.clipboard.writeText(this.stripePublishableKey).then(() => {
      this.copiedKey = true;
      setTimeout(() => {
        this.copiedKey = false;
      }, 2000);
    });
  }

  startAddZone(): void {
    this.showZoneForm = true;
    this.editingZoneId = null;
    this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
  }

  editZone(zone: ShippingZone): void {
    this.showZoneForm = true;
    this.editingZoneId = zone.id;
    this.zoneForm.reset({
      id: zone.id,
      name: zone.name,
      region: zone.region,
      rates: zone.rates.join(", "),
    });
  }

  saveZone(): void {
    if (this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      const invalidFields: string[] = [];
      Object.keys(this.zoneForm.controls).forEach((key) => {
        if (this.zoneForm.get(key)?.invalid) invalidFields.push(key);
      });
      this.notification.warn(`Please fill in all required fields: ${invalidFields.join(", ")}`);
      return;
    }

    const formValue = this.zoneForm.getRawValue();
    const updatedZone: ShippingZone = {
      id: formValue.id ?? 0,
      name: formValue.name,
      region: formValue.region,
      rates: formValue.rates
        .split(",")
        .map((rate) => rate.trim())
        .filter(Boolean),
    };

    this.isSaving = true;

    if (this.editingZoneId) {
      this.settingsService
        .updateShippingZone(this.editingZoneId, updatedZone)
        .subscribe((zone) => {
          this.isSaving = false;
          this.shippingZones = this.shippingZones.map((item) =>
            item.id === zone.id ? zone : item,
          );
          this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
          this.showZoneForm = false;
          this.editingZoneId = null;
        });
      return;
    }

    this.settingsService.createShippingZone(updatedZone).subscribe((zone) => {
      this.isSaving = false;
      this.shippingZones = [...this.shippingZones, zone];
      this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
      this.showZoneForm = false;
      this.editingZoneId = null;
    });
  }

  cancelZoneEdit(): void {
    this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
    this.showZoneForm = false;
    this.editingZoneId = null;
  }

  deleteZone(zone: ShippingZone): void {
    if (!confirm(`Delete the ${zone.name} zone?`)) {
      return;
    }

    this.settingsService.deleteShippingZone(zone.id).subscribe((success) => {
      if (!success) {
        return;
      }
      this.shippingZones = this.shippingZones.filter(
        (item) => item.id !== zone.id,
      );
    });
  }

  startAddDelivery(): void {
    this.showDeliveryForm = true;
    this.editingDeliveryId = null;
    this.deliveryForm.reset({
      id: 0,
      name: "",
      cost: 0,
      estimatedDays: "",
      isActive: true,
    });
  }

  editDelivery(method: DeliveryMethod): void {
    this.showDeliveryForm = true;
    this.editingDeliveryId = method.id;
    this.deliveryForm.reset({
      id: method.id,
      name: method.name,
      cost: method.cost,
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
    });
  }

  saveDelivery(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      const invalidFields: string[] = [];
      Object.keys(this.deliveryForm.controls).forEach((key) => {
        if (this.deliveryForm.get(key)?.invalid) invalidFields.push(key);
      });
      this.notification.warn(`Please fill in all required fields: ${invalidFields.join(", ")}`);
      return;
    }

    const formValue = this.deliveryForm.getRawValue();
    const payload: Partial<DeliveryMethod> = {
      id: formValue.id ?? 0,
      name: formValue.name,
      cost: formValue.cost,
      estimatedDays: formValue.estimatedDays || undefined,
      isActive: formValue.isActive,
    };

    this.isSaving = true;

    if (this.editingDeliveryId) {
      this.settingsService
        .updateDeliveryMethod(this.editingDeliveryId, payload)
        .subscribe(() => {
          this.isSaving = false;
          this.deliveryMethods = this.deliveryMethods.map((m) =>
            m.id === this.editingDeliveryId
              ? ({ ...m, ...payload } as DeliveryMethod)
              : m,
          );
          this.closeDeliveryForm();
        });
    } else {
      this.settingsService
        .createDeliveryMethod(payload)
        .subscribe((newMethod) => {
          this.isSaving = false;
          this.deliveryMethods = [...this.deliveryMethods, newMethod];
          this.closeDeliveryForm();
        });
    }
  }

  closeDeliveryForm(): void {
    this.showDeliveryForm = false;
    this.editingDeliveryId = null;
    this.deliveryForm.reset({
      id: 0,
      name: "",
      cost: 0,
      estimatedDays: "",
      isActive: true,
    });
  }

  deleteDelivery(method: DeliveryMethod): void {
    if (!confirm(`Delete the "${method.name}" delivery method?`)) {
      return;
    }

    this.settingsService.deleteDeliveryMethod(method.id).subscribe(() => {
      this.deliveryMethods = this.deliveryMethods.filter(
        (m) => m.id !== method.id,
      );
    });
  }

  rateClass(rate: string): string {
    if (rate.toLowerCase().includes("free shipping")) {
      return "px-2 py-1 bg-accent/30 text-primary text-xs rounded-md font-medium";
    }

    return "px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded-md font-medium";
  }
}
