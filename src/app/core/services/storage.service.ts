import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAll<T>(key: string): T[] | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : null;
    } catch {
      return null;
    }
  }

  save<T>(key: string, items: T[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // localStorage lleno o no disponible — silencioso
    }
  }

  getItem<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  saveItem<T>(key: string, item: T): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch {
      // localStorage lleno o no disponible — silencioso
    }
  }

  clear(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }
}
