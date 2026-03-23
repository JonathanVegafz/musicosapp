import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Note, Interval } from 'tonal';

@Component({
  selector: 'app-transpose-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .transpose {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      background: var(--surface-overlay);
      color: var(--text-primary);
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s;
      line-height: 1;

      &:hover:not(:disabled) {
        background: var(--surface-hover);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .key-display {
      min-width: 3.5rem;
      text-align: center;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--accent-chord);
    }

    .key-delta {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-weight: 400;
    }
  `,
  template: `
    <div class="transpose" role="group" aria-label="Control de transposición">
      <button
        class="btn"
        (click)="onDown()"
        [disabled]="semitones() <= -6"
        aria-label="Bajar un semitono"
      >
        −
      </button>

      <div class="key-display" aria-live="polite" [attr.aria-label]="'Tonalidad actual: ' + displayKey()">
        {{ displayKey() }}
        @if (semitones() !== 0) {
          <div class="key-delta">{{ semitones() > 0 ? '+' : '' }}{{ semitones() }}</div>
        }
      </div>

      <button
        class="btn"
        (click)="onUp()"
        [disabled]="semitones() >= 6"
        aria-label="Subir un semitono"
      >
        +
      </button>
    </div>
  `,
})
export class TransposeControlComponent {
  readonly originalKey = input.required<string>();
  readonly semitones = input.required<number>();
  readonly transposeChange = output<number>();

  readonly displayKey = computed(() => {
    const delta = this.semitones();
    const key = this.originalKey();
    if (delta === 0) return key;
    try {
      const interval = Interval.fromSemitones(delta);
      return Note.transpose(key, interval) || key;
    } catch {
      return key;
    }
  });

  onUp(): void {
    this.transposeChange.emit(this.semitones() + 1);
  }

  onDown(): void {
    this.transposeChange.emit(this.semitones() - 1);
  }
}
