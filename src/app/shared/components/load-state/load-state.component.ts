import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Presentational loading / error indicator. Shows an accessible spinner while
 * `loading` is true, or an `role="alert"` message when `error` is set.
 */
@Component({
  selector: 'app-load-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .load-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .load-state--error {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      justify-content: flex-start;
    }

    i { font-size: 1.1rem; }
  `,
  template: `
    @if (loading()) {
      <div class="load-state" role="status" aria-live="polite">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ loadingText() }}</span>
      </div>
    } @else if (error()) {
      <div class="load-state load-state--error" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <span>{{ error() }}</span>
      </div>
    }
  `,
})
export class LoadStateComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly loadingText = input('Cargando...');
}
