import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";
import {
  LucideAngularModule,
  Phone,
  MessageSquare,
  MessageCircle,
  Plus,
  X,
} from "lucide-angular";
import { SiteSettingsService } from "../../../core/services/site-settings.service";

@Component({
  selector: "app-contact-fab",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger("famTrigger", [
      state("void", style({ transform: "scale(0)", opacity: 0 })),
      state("*", style({ transform: "scale(1)", opacity: 1 })),
      transition("void => *", animate("200ms cubic-bezier(0.2, 0, 0, 1)")),
      transition("* => void", animate("200ms ease-out")),
    ]),
    trigger("optionTrigger", [
      state("void", style({ transform: "translateY(10px)", opacity: 0 })),
      state("*", style({ transform: "translateY(0)", opacity: 1 })),
      transition(
        ":enter",
        animate("200ms {{delay}}ms cubic-bezier(0.2, 0, 0, 1)"),
      ),
      transition(
        ":leave",
        animate(
          "150ms ease-in",
          style({ opacity: 0, transform: "translateY(10px)" }),
        ),
      ),
    ]),
  ],
  styles: [
    `
      @keyframes bounce-wave {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-4px);
        }
      }
      .dot-anim {
        animation: bounce-wave 1.2s infinite ease-in-out;
      }
      .dot-1 {
        animation-delay: 0s;
      }
      .dot-2 {
        animation-delay: 0.2s;
      }
      .dot-3 {
        animation-delay: 0.4s;
      }
    `,
  ],
  template: `
    <div
      class="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-4"
      *ngIf="contactPhone || whatsAppNumber || messengerUrl"
      [@famTrigger]
    >
      <!-- Options Stack -->
      <div *ngIf="isOpen" class="flex flex-col gap-3 mb-2">
        <!-- Messenger Option -->
        <a
          *ngIf="messengerUrl"
          [href]="messengerUrl"
          target="_blank"
          [@optionTrigger]="{ value: '', params: { delay: 100 } }"
          class="w-12 h-12 flex items-center justify-center rounded-full bg-[#0084FF] shadow-lg hover:scale-110 transition-transform text-white border border-white/20"
          title="Messenger"
        >
          <lucide-icon
            [img]="icons.MessageCircle"
            class="w-5 h-5"
          ></lucide-icon>
        </a>

        <!-- WhatsApp Option -->
        <a
          *ngIf="whatsAppNumber"
          [href]="'https://wa.me/' + whatsAppNumber"
          target="_blank"
          [@optionTrigger]="{ value: '', params: { delay: 50 } }"
          class="w-12 h-12 flex items-center justify-center rounded-full bg-[#25D366] shadow-lg hover:scale-110 transition-transform text-white border border-white/20"
          title="WhatsApp Us"
        >
          <lucide-icon
            [img]="icons.MessageSquare"
            class="w-5 h-5"
          ></lucide-icon>
        </a>

        <!-- Phone Option -->
        <a
          *ngIf="contactPhone"
          [href]="'tel:' + contactPhone"
          [@optionTrigger]="{ value: '', params: { delay: 0 } }"
          class="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:scale-110 transition-transform text-[#0e181b] border border-white/20"
          title="Call Us"
        >
          <lucide-icon [img]="icons.Phone" class="w-5 h-5"></lucide-icon>
        </a>
      </div>

      <!-- Main Toggle Button -->
      <button
        (click)="toggle()"
        class="w-14 h-14 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-105 border border-white/40"
        [class.bg-white]="!isOpen"
        [class.bg-gray-100]="isOpen"
      >
        <!-- Close / Add Icon -->
        <lucide-icon
          *ngIf="isOpen"
          [img]="icons.Plus"
          class="w-7 h-7 text-[#0e181b] rotate-45"
        ></lucide-icon>

        <!-- Animated Dots -->
        <div *ngIf="!isOpen" class="flex items-center gap-1">
          <span
            class="w-1.5 h-1.5 bg-[#0e181b] rounded-full dot-anim dot-1"
          ></span>
          <span
            class="w-1.5 h-1.5 bg-[#0e181b] rounded-full dot-anim dot-2"
          ></span>
          <span
            class="w-1.5 h-1.5 bg-[#0e181b] rounded-full dot-anim dot-3"
          ></span>
        </div>
      </button>
    </div>
  `,
})
export class ContactFabComponent implements OnInit {
  readonly icons = {
    Phone,
    MessageSquare,
    MessageCircle,
    Plus,
    X,
  };

  private settingsService = inject(SiteSettingsService);

  isOpen = false;
  contactPhone = "";
  whatsAppNumber = "";
  messengerUrl = "";

  ngOnInit() {
    this.settingsService.getSettings().subscribe((settings) => {
      this.contactPhone = settings.contactPhone || "";
      this.whatsAppNumber = settings.whatsAppNumber || "";
      this.messengerUrl = settings.facebookUrl || "";
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
