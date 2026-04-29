import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MixerPreset } from '../../../types';

export interface BuiltinPreset {
  id: string;
  name: string;
  icon: string;
}

export const BUILTIN_PRESETS: readonly BuiltinPreset[] = [
  { id: 'full-band', name: 'Full band', icon: 'pi-users' },
  { id: 'sin-guitarra', name: 'Sin guitarra', icon: 'pi-ban' },
  { id: 'solo-base', name: 'Solo base rítmica', icon: 'pi-clock' },
] as const;

@Component({
  selector: 'app-practice-presets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .presets {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .presets-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .preset-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      background: var(--surface-overlay);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      &[aria-pressed="true"] {
        background: rgba(167, 139, 250, 0.15);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      i { font-size: 0.75rem; }
    }

    .preset-btn-custom {
      background: transparent;
      border: 1px dashed var(--surface-border);
      color: var(--text-muted);

      &:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }
    }

    .preset-btn-delete {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.2rem 0.4rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.7rem;
      margin-left: 0.2rem;
      line-height: 1;

      &:hover { color: #ef4444; }
    }

    .save-row {
      display: flex;
      gap: 0.5rem;
    }

    .save-input {
      flex: 1;
      padding: 0.35rem 0.6rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      background: var(--surface-overlay);
      color: var(--text-primary);
      font-size: 0.8rem;
      outline: none;

      &:focus { border-color: var(--accent-primary); }
    }

    .save-confirm-btn {
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-md);
      border: none;
      background: var(--accent-primary);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;

      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .save-cancel-btn {
      padding: 0.35rem 0.5rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.8rem;
      cursor: pointer;
    }

    .section-label {
      font-size: 0.725rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
  `,
  template: `
    <div class="presets">
      <!-- Built-in presets -->
      <div>
        <p class="section-label">Presets rápidos</p>
        <div class="presets-row" role="group" aria-label="Presets de mezcla">
          @for (preset of builtinPresets; track preset.id) {
            <button
              class="preset-btn"
              [attr.aria-pressed]="activePresetId() === preset.id"
              [attr.aria-label]="'Aplicar preset: ' + preset.name"
              (click)="applyPreset(preset.id)"
            >
              <i class="pi" [class]="preset.icon" aria-hidden="true"></i>
              {{ preset.name }}
            </button>
          }
        </div>
      </div>

      <!-- Custom presets -->
      @if (presets().length > 0) {
        <div>
          <p class="section-label">Mis presets</p>
          <div class="presets-row">
            @for (preset of presets(); track preset.id) {
              <span style="display:inline-flex;align-items:center;">
                <button
                  class="preset-btn"
                  [attr.aria-pressed]="activePresetId() === preset.id"
                  [attr.aria-label]="'Aplicar preset guardado: ' + preset.name"
                  (click)="applyPreset(preset.id)"
                >
                  <i class="pi pi-bookmark" aria-hidden="true"></i>
                  {{ preset.name }}
                </button>
                <button
                  class="preset-btn-delete"
                  [attr.aria-label]="'Eliminar preset: ' + preset.name"
                  (click)="deletePreset(preset.id)"
                >
                  <i class="pi pi-times" aria-hidden="true"></i>
                </button>
              </span>
            }
          </div>
        </div>
      }

      <!-- Save current as preset -->
      @if (showSaveInput()) {
        <div class="save-row">
          <label [for]="saveInputId" class="sr-only">Nombre del nuevo preset</label>
          <input
            [id]="saveInputId"
            #saveInput
            class="save-input"
            type="text"
            placeholder="Nombre del preset…"
            [value]="newPresetName()"
            (input)="newPresetName.set(getInputValue($event))"
            (keydown.enter)="confirmSave()"
            (keydown.escape)="showSaveInput.set(false)"
            aria-label="Nombre del nuevo preset"
          />
          <button
            class="save-confirm-btn"
            [disabled]="!newPresetName().trim()"
            (click)="confirmSave()"
            aria-label="Confirmar guardar preset"
          >
            Guardar
          </button>
          <button
            class="save-cancel-btn"
            (click)="showSaveInput.set(false)"
            aria-label="Cancelar"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
      } @else {
        <button
          class="preset-btn preset-btn-custom"
          (click)="showSaveInput.set(true)"
          aria-label="Guardar mezcla actual como nuevo preset"
        >
          <i class="pi pi-plus" aria-hidden="true"></i>
          Guardar mezcla actual
        </button>
      }
    </div>
  `,
})
export class PracticePresetsComponent {
  readonly presets = input.required<MixerPreset[]>();
  readonly activePresetId = input<string | null>(null);
  readonly presetApply = output<string>();
  readonly presetSave = output<string>();
  readonly presetDelete = output<string>();

  readonly builtinPresets = BUILTIN_PRESETS;
  readonly showSaveInput = signal(false);
  readonly newPresetName = signal('');
  readonly saveInputId = `preset-save-${Math.random().toString(36).slice(2)}`;

  applyPreset(id: string): void {
    this.presetApply.emit(id);
  }

  deletePreset(id: string): void {
    this.presetDelete.emit(id);
  }

  confirmSave(): void {
    const name = this.newPresetName().trim();
    if (!name) return;
    this.presetSave.emit(name);
    this.newPresetName.set('');
    this.showSaveInput.set(false);
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
