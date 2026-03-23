import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-youtube-embed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .yt-wrapper {
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
    }

    .yt-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      width: 100%;
      border-radius: var(--radius-lg);
      transition: color 0.15s, background 0.15s;

      &:hover {
        color: var(--text-primary);
        background: var(--surface-hover);
      }

      i { color: #ff4444; }
    }

    .yt-frame-wrap {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;

      iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
    }
  `,
  template: `
    <div class="yt-wrapper">
      <button class="yt-toggle" (click)="toggle()" [attr.aria-expanded]="visible()">
        <i class="pi pi-youtube" aria-hidden="true"></i>
        <span>{{ visible() ? 'Ocultar video' : 'Ver video de referencia' }}</span>
        <i class="pi" [class]="visible() ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i>
      </button>

      @if (visible() && safeUrl()) {
        <div class="yt-frame-wrap">
          <iframe
            [src]="safeUrl()!"
            title="Video de referencia de la canción"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      }
    </div>
  `,
})
export class YouTubeEmbedComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  readonly url = input.required<string>();
  readonly visible = signal(false);

  readonly safeUrl = computed((): SafeResourceUrl | null => {
    if (!isPlatformBrowser(this.platformId)) return null;
    const u = this.url();
    if (!u) return null;
    const match = u.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
    );
    const id = match?.[1];
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
    );
  });

  toggle(): void {
    this.visible.update((v) => !v);
  }
}
