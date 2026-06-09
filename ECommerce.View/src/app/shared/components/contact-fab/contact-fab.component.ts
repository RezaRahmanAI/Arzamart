import { Component, inject, OnInit } from "@angular/core";
import { NgIf } from '@angular/common';
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";
import { SiteSettingsService } from "../../../core/services/site-settings.service";


@Component({
  selector: "app-contact-fab",
  standalone: true,
  imports: [NgIf],
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </a>

        <!-- Phone Option -->
        <a
          *ngIf="contactPhone"
          [href]="'tel:' + contactPhone"
          [@optionTrigger]="{ value: '', params: { delay: 0 } }"
          class="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:scale-110 transition-transform text-[#0e181b] border border-white/20"
          title="Call Us"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
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
        <svg *ngIf="isOpen" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#0e181b] rotate-45"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>

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
  private settingsService = inject(SiteSettingsService);

  isOpen = true;
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
