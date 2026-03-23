import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FontSize } from '../../../types';

interface SizeOption {
  value: FontSize;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-font-size-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .font-control {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .size-btn {
      padding: 0.35rem 0.6rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-border);
      background: var(--surface-overlay);
      color: var(--text-secondary);
      cursor: pointer;
      font-weight: 600;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      line-height: 1;

      &:hover:not(.active) {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(167, 139, 250, 0.15);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }
    }
  `,
  template: `
    <div class="font-control" role="group" aria-label="Tamaño de fuente">
      @for (option of sizes; track option.value) {
        <button
          class="size-btn"
          [class.active]="current() === option.value"
          (click)="sizeChange.emit(option.value)"
          [attr.aria-label]="'Tamaño ' + option.label"
          [attr.aria-pressed]="current() === option.value"
        >
          {{ option.icon }}
        </button>
      }
    </div>
  `,
})
export class FontSizeControlComponent {
  readonly current = input.required<FontSize>();
  readonly sizeChange = output<FontSize>();

  readonly sizes: SizeOption[] = [
    { value: 'normal', label: 'normal', icon: 'A' },
    { value: 'large', label: 'grande', icon: 'AA' },
    { value: 'xlarge', label: 'extra grande', icon: 'AAA' },
  ];
}
