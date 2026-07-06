import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface ToastMessage {
  type: "SUCCESS" | "ERROR" | "INFO" | "WARNING";
  message: string;
  id: number;
}

export interface UndoToastMessage {
  type: "UNDO";
  message: string;
  id: number;
  duration: number;
  undoCallback: () => void;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toast$ = this.toastSubject.asObservable();

  private undoToastSubject = new BehaviorSubject<UndoToastMessage | null>(null);
  undoToast$ = this.undoToastSubject.asObservable();

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

  showUndo(message: string, undoCallback: () => void, duration = 8000): void {
    console.log(`[UNDO] ${message}`);
    this.undoToastSubject.next({
      type: "UNDO",
      message,
      id: ++this.counter,
      duration,
      undoCallback,
    });
  }

  dismissUndo(): void {
    this.undoToastSubject.next(null);
  }

  private show(
    type: "SUCCESS" | "ERROR" | "INFO" | "WARNING",
    message: string,
  ): void {
    console.log(`[${type}] ${message}`);
    this.toastSubject.next({ type, message, id: ++this.counter });
  }
}
