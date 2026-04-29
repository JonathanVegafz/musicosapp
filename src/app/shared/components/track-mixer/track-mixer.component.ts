import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Track, TrackType } from '../../../types';

interface TrackTypeOption {
  value: TrackType;
  label: string;
  icon: string;
}

export const TRACK_TYPE_OPTIONS: TrackTypeOption[] = [
  { value: 'click', label: 'Click', icon: 'pi-stopwatch' },
  { value: 'drums', label: 'Batería', icon: 'pi-volume-up' },
  { value: 'bass', label: 'Bajo', icon: 'pi-wave-pulse' },
  { value: 'guitar-electric', label: 'Guitarra Eléctrica', icon: 'pi-bolt' },
  { value: 'guitar-acoustic', label: 'Guitarra Acústica', icon: 'pi-sun' },
  { value: 'keys', label: 'Teclado/Piano', icon: 'pi-server' },
  { value: 'pads', label: 'Pads/Synth', icon: 'pi-cloud' },
  { value: 'vocals', label: 'Voces/Guía', icon: 'pi-microphone' },
  { value: 'other', label: 'Otro', icon: 'pi-question-circle' },
];

@Component({
  selector: 'app-track-mixer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .track-strip {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      transition: border-color 0.15s;
    }

    .track-strip:has(.mute-btn[aria-pressed="true"]) {
      opacity: 0.55;
    }

    .track-icon {
      color: var(--text-muted);
      font-size: 1rem;
      width: 20px;
      text-align: center;
    }

    .track-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .track-name-input {
      background: transparent;
      border: none;
      border-bottom: 1px solid transparent;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0;
      width: 100%;
      outline: none;
      transition: border-color 0.15s;

      &:focus {
        border-bottom-color: var(--accent-primary);
      }
    }

    .track-type-select {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 0;
      outline: none;
      cursor: pointer;

      option {
        background: var(--surface-card);
        color: var(--text-primary);
      }
    }

    .volume-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .volume-slider {
      width: 80px;
      height: 4px;
      accent-color: var(--accent-primary);
      cursor: pointer;
    }

    .volume-pct {
      font-size: 0.725rem;
      color: var(--text-muted);
      min-width: 2.5rem;
      text-align: right;
      font-family: var(--font-mono);
    }

    .toggle-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;

      &:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      &[aria-pressed="true"] {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: #fff;
      }
    }

    .solo-btn[aria-pressed="true"] {
      background: #f59e0b;
      border-color: #f59e0b;
      color: #fff;
    }
  `,
  template: `
    <div class="track-strip" [attr.aria-label]="'Pista: ' + track().name">
      <!-- Type icon -->
      <i class="pi track-icon" [class]="typeIcon()" aria-hidden="true"></i>

      <!-- Name + type -->
      <div class="track-info">
        <input
          class="track-name-input"
          type="text"
          [value]="track().name"
          [attr.aria-label]="'Nombre de pista: ' + track().name"
          (change)="onNameChange($event)"
        />
        <select
          class="track-type-select"
          [value]="track().type"
          [attr.aria-label]="'Tipo de pista: ' + track().type"
          (change)="onTypeChange($event)"
        >
          @for (opt of typeOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      </div>

      <!-- Volume -->
      <div class="volume-wrap">
        <input
          class="volume-slider"
          type="range"
          min="0"
          max="100"
          [value]="track().volume"
          [attr.aria-label]="'Volumen de ' + track().name"
          [attr.aria-valuenow]="track().volume"
          aria-valuemin="0"
          aria-valuemax="100"
          (input)="onVolumeInput($event)"
        />
        <span class="volume-pct" aria-hidden="true">{{ track().volume }}%</span>
      </div>

      <!-- Mute -->
      <button
        class="toggle-btn mute-btn"
        [attr.aria-pressed]="track().muted"
        [attr.aria-label]="track().muted ? 'Activar pista ' + track().name : 'Silenciar pista ' + track().name"
        (click)="toggleMute()"
        title="Mute"
      >
        M
      </button>

      <!-- Solo -->
      <button
        class="toggle-btn solo-btn"
        [attr.aria-pressed]="track().solo"
        [attr.aria-label]="track().solo ? 'Quitar solo de ' + track().name : 'Solo ' + track().name"
        (click)="toggleSolo()"
        title="Solo"
      >
        S
      </button>
    </div>
  `,
})
export class TrackMixerComponent {
  readonly track = input.required<Track>();
  readonly trackChange = output<Partial<Track>>();

  readonly typeOptions = TRACK_TYPE_OPTIONS;

  protected typeIcon(): string {
    return TRACK_TYPE_OPTIONS.find((o) => o.value === this.track().type)?.icon ?? 'pi-question-circle';
  }

  onVolumeInput(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.trackChange.emit({ volume: value, muted: false });
  }

  toggleMute(): void {
    this.trackChange.emit({ muted: !this.track().muted });
  }

  toggleSolo(): void {
    this.trackChange.emit({ solo: !this.track().solo });
  }

  onNameChange(event: Event): void {
    const name = (event.target as HTMLInputElement).value.trim();
    if (name) this.trackChange.emit({ name });
  }

  onTypeChange(event: Event): void {
    const type = (event.target as HTMLSelectElement).value as TrackType;
    this.trackChange.emit({ type });
  }
}
