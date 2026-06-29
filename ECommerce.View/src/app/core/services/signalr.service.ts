import { Injectable, inject } from "@angular/core";
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { Subject, Observable } from "rxjs";
import { Order } from "../models/order";
import { NotificationService } from "./notification.service";
import { AuthService } from "./auth.service";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class SignalrService {
  private hubConnection!: HubConnection;
  private newOrdersSubject = new Subject<Order>();
  private notification = inject(NotificationService);
  private authService = inject(AuthService);

  public newOrders$: Observable<Order> = this.newOrdersSubject.asObservable();

  constructor() {
    this.buildConnection();
    this.authService.currentUser.subscribe(user => {
      if (user && (user.role === 'SuperAdmin' || user.role === 'Admin' || user.role === 'Manager' || user.role === 'Staff')) {
        this.startConnection();
      } else {
        this.stopConnection();
      }
    });
  }

  private buildConnection() {
    const baseUrl = environment.apiBaseUrl.endsWith("/api")
      ? environment.apiBaseUrl.substring(0, environment.apiBaseUrl.length - 4)
      : environment.apiBaseUrl;
    const hubUrl = `${baseUrl}/hubs/orders`;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.getAccessToken() || ""
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.on("ReceiveOrderNotification", (order: Order) => {
      this.newOrdersSubject.next(order);
      this.playNotificationSound();
      
      // Also show a toast notification immediately
      this.notification.info(`New Live Order: ${order.orderNumber} placed by ${order.customerName} for ৳${order.total}!`);
    });
  }

  private startConnection() {
    const user = this.authService.currentUserSnapshot();
    const isStaff = user && (user.role === 'SuperAdmin' || user.role === 'Admin' || user.role === 'Manager' || user.role === 'Staff');
    if (!isStaff) return;

    if (this.hubConnection.state === HubConnectionState.Disconnected) {
      this.hubConnection
        .start()
        .then(() => {
          console.log("SignalR Connection started successfully.");
        })
        .catch((err) => {
          console.error("Error while starting SignalR connection: ", err);
          // Try to reconnect in 5 seconds
          setTimeout(() => this.startConnection(), 5000);
        });
    }
  }

  public stopConnection() {
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      this.hubConnection.stop();
    }
  }

  private playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        gainNode.gain.setValueAtTime(0.15, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.3); // C5
      playTone(659.25, now + 0.12, 0.4); // E5
    } catch (e) {
      console.warn("Web Audio API sound blocked or unsupported:", e);
    }
  }
}
