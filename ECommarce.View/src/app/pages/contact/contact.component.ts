import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { finalize } from "rxjs/operators";
import { ContactPayload, ContactService } from "./contact.service";
import { SiteSettingsService } from "../../core/services/site-settings.service";

type SocialLink = {
  name: string;
  href: string;
  path: string;
  fillRule?: string;
  clipRule?: string;
};

type InquiryTopic = {
  value: string;
  label: string;
};

import {
  LucideAngularModule,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  Store,
} from "lucide-angular";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./contact.component.html",
})
export class ContactComponent {
  readonly icons = {
    Mail,
    Phone,
    MapPin,
    HelpCircle,
    ArrowRight,
    ChevronDown,
    Store,
  };
  supportEmail = "support@sherashopbd.com";
  phone = "+8801XXXXXXXXX";
  phoneDial = "+8801XXXXXXXXX";
  address = "Dhaka, Bangladesh";
  addressLines: string[] = [];
  officeHours = "Sat-Thu, 10am - 8pm BST.";

  mapDetails = {
    storeName: "SheraShopBD Flagship",
    openHours: "Open daily 10am - 8pm",
    locationLabel: "Dhaka, Bangladesh",
  };

  mapLocation = "Dhaka, Bangladesh";

  inquiryTopics: InquiryTopic[] = [
    { value: "sizing", label: "Sizing & Fit" },
    { value: "order", label: "Order Status" },
    { value: "returns", label: "Returns & Exchanges" },
    { value: "other", label: "General Inquiry" },
  ];

  socialLinks: SocialLink[] = [
    {
      name: "Instagram",
      href: "https://www.instagram.com",
      path: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.488 2h-.173zm-3.76 2.943c-2.115 0-2.373.009-3.21.047-.85.039-1.313.175-1.62.294-.405.157-.695.344-1.002.651-.307.307-.494.597-.651 1.002-.119.307-.255.77-.294 1.62-.038.837-.047 1.095-.047 3.235v.14c0 2.115.009 2.373.047 3.21.039.85.175 1.313.294 1.62.157.405.344.695.651 1.002.307.307.597.494 1.002.651.307.119.77.255 1.62.294.837.038 1.095.047 3.235.047h.14c2.115 0 2.373-.009 3.21-.047.85-.039 1.313-.175 1.62-.294.405-.157.695-.344 1.002-.651.307-.307.494-.597.651-1.002.119-.307.255-.77.294-1.62.038-.837.047-1.095.047-3.235v-.14c0-2.115-.009-2.373-.047-3.21-.039-.85-.175-1.313-.294-1.62-.157-.405-.344-.695-.651-1.002-.307-.307-.597-.494-1.002-.651-.307-.119-.77-.255-1.62-.294-.837-.038-1.095-.047-3.235-.047z",
      fillRule: "evenodd",
      clipRule: "evenodd",
    },
    {
      name: "Twitter",
      href: "https://www.twitter.com",
      path: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84",
    },
    {
      name: "Pinterest",
      href: "https://www.pinterest.com",
      path: "M12.017 2C6.484 2 2 6.484 2 12.017c0 4.3 2.7 7.96 6.55 9.358-.09-.794-.17-2.01.036-2.876.185-.783 1.2-5.084 1.2-5.084s-.305-.61-.305-1.51c0-1.415.82-2.47 1.84-2.47.868 0 1.288.65 1.288 1.43 0 .872-.555 2.176-.84 3.386-.24.996.5 1.808 1.48 1.808 1.775 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-3.045 0-4.833 2.284-4.833 4.644 0 .92.354 1.907.795 2.443.088.106.1.2.074.308-.08.337-.26.914-.36 1.092-.057.1-.215.12-.398.035-1.48-.688-2.176-2.544-2.176-4.095 0-3.03 2.55-5.81 7.35-5.81 3.862 0 6.37 2.793 6.37 5.727 0 3.42-2.154 6.178-5.146 6.178-1.004 0-1.95-.52-2.274-1.134 0 0-.547 2.08-.68 2.59-.204.78-.606 1.565-.97 2.164 1.12.33 2.316.51 3.555.51 5.534 0 10.017-4.483 10.017-10.017C22.034 6.484 17.55 2 12.017 2z",
      fillRule: "evenodd",
      clipRule: "evenodd",
    },
  ];

  isSubmitting = false;
  isSubmitted = false;
  successMessage = "";
  helpCenterLink: string | null = null;
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    private router: Router,
    private settingsService: SiteSettingsService,
  ) {
    this.settingsService.getSettings().subscribe((settings) => {
      if (settings) {
        this.supportEmail = settings.contactEmail || this.supportEmail;
        this.phone = settings.contactPhone || this.phone;
        this.phoneDial =
          settings.contactPhone?.replace(/[^0-9+]/g, "") || this.phoneDial;
        this.address = settings.address || this.address;
        this.addressLines = this.address ? this.address.split("\n") : [];
        this.mapDetails.storeName =
          settings.websiteName || this.mapDetails.storeName;
        this.mapLocation = settings.address || this.mapLocation;
      }
    });
    this.helpCenterLink = this.router.config.some(
      (route) => route.path === "help",
    )
      ? "/help"
      : null;
    this.form = this.formBuilder.nonNullable.group({
      fullName: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      inquiryType: ["", [Validators.required]],
      message: ["", [Validators.required, Validators.minLength(10)]],
    });
  }

  get mapsUrl(): string {
    const encodedLocation = encodeURIComponent(this.mapLocation);
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }

  openDirections(): void {
    window.open(this.mapsUrl, "_blank", "noopener");
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.successMessage = "";

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload: ContactPayload = this.form.getRawValue();

    this.contactService
      .submitContact(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe(() => {
        this.successMessage =
          "Thanks for reaching out! We'll get back to you shortly.";
        this.form.reset();
        this.isSubmitted = false;
      });
  }

  shouldShowError(controlName: keyof ContactPayload): boolean {
    const control = this.form.get(controlName);
    if (!control) {
      return false;
    }
    return control.invalid && (control.touched || this.isSubmitted);
  }
}
