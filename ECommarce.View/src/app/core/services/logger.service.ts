import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private level: LogLevel = LogLevel.Debug; // Default level

  constructor() {
    this.checkEnvironment();
  }

  private checkEnvironment(): void {
    if (environment.production) {
      this.level = LogLevel.Warn; // Only show Warn and Error in production
    }
  }

  debug(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Debug)) {
      console.log(
        `%c [DEBUG] ${this.getTimestamp()} - ${message}`,
        'color: #6c757d; font-weight: bold;',
        ...optionalParams
      );
    }
  }

  info(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Info)) {
      console.info(
        `%c [INFO] ${this.getTimestamp()} - ${message}`,
        'color: #0d6efd; font-weight: bold;',
        ...optionalParams
      );
    }
  }

  success(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Info)) {
      console.log(
        `%c [SUCCESS] ${this.getTimestamp()} - ${message}`,
        'color: #198754; font-weight: bold;',
        ...optionalParams
      );
    }
  }

  warn(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Warn)) {
      console.warn(
        `%c [WARN] ${this.getTimestamp()} - ${message}`,
        'color: #ffc107; color: #000; font-weight: bold;',
        ...optionalParams
      );
    }
  }

  error(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Error)) {
      console.error(
        `%c [ERROR] ${this.getTimestamp()} - ${message}`,
        'color: #dc3545; font-weight: bold;',
        ...optionalParams
      );
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level && this.level !== LogLevel.None;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }
}
