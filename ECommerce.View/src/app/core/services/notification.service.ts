import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface ToastMessage {
  type: "SUCCESS" | "ERROR" | "INFO" | "WARNING";
  message: string;
  id: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toast$ = this.toastSubject.asObservable();
  private counter = 0;

  success(message: string): void {
    this.show("SUCCESS", message);
  }

  error(message: string): void {
    this.show("ERROR", message);
  }

  info(message: string): void {
    this.show("INFO", message);
  }

  warn(message: string): void {
    this.show("WARNING", message);
  }

  private show(
    type: "SUCCESS" | "ERROR" | "INFO" | "WARNING",
    message: string,
  ): void {
    console.log(`[${type}] ${message}`);
    this.toastSubject.next({ type, message, id: ++this.counter });

    // Auto-dismiss logic can be handled here or in the component.
    // For simplicity, we just emit the event.
  }
}
