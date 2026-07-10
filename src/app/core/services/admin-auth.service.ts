import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const ADMIN_CODE = 'musicosadmin1234';
const STORAGE_KEY = 'musicos-admin-unlocked';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly unlocked = signal<boolean>(this.readUnlocked());
  readonly visible = signal(false);
  readonly errorMsg = signal<string | null>(null);

  private pendingResolve: ((granted: boolean) => void) | null = null;

  requestUnlock(): Promise<boolean> {
    if (this.unlocked()) return Promise.resolve(true);
    this.errorMsg.set(null);
    this.visible.set(true);
    return new Promise<boolean>((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  submit(code: string): void {
    if (code !== ADMIN_CODE) {
      this.errorMsg.set('Código incorrecto. Intenta de nuevo.');
      return;
    }
    this.unlocked.set(true);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, '1');
    }
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(granted: boolean): void {
    this.visible.set(false);
    this.errorMsg.set(null);
    this.pendingResolve?.(granted);
    this.pendingResolve = null;
  }

  private readUnlocked(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  }
}
