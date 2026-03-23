import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Song } from '../../../types';

@Component({
  selector: 'app-song-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .card {
      display: block;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 1.1rem 1.25rem;
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, transform 0.1s;
      position: relative;

      &:hover {
        border-color: rgba(167, 139, 250, 0.4);
        background: var(--surface-overlay);
        transform: translateY(-1px);
      }
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    .title {
      font-size: 0.975rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .key-badge {
      flex-shrink: 0;
      background: var(--accent-chord-bg);
      color: var(--accent-chord);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: var(--radius-sm);
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .artist {
      font-size: 0.825rem;
      color: var(--text-secondary);
      margin-bottom: 0.6rem;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-top: 0.6rem;
    }

    .tag {
      background: var(--surface-hover);
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      padding: 0.1rem 0.45rem;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .action-btn {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      opacity: 0;
      background: var(--surface-hover);
      border: none;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.3rem 0.4rem;
      transition: opacity 0.15s, color 0.15s;

      &:hover { color: #ef4444; }
    }

    .card:hover .action-btn { opacity: 1; }
  `,
  template: `
    <a
      class="card"
      [routerLink]="['/songs', song().id]"
      [attr.aria-label]="song().title + ' por ' + song().artist"
    >
      <div class="card-header">
        <div class="title">{{ song().title }}</div>
        <span class="key-badge">{{ song().key }}</span>
      </div>

      <div class="artist">{{ song().artist }}</div>

      <div class="meta">
        <span class="meta-item">
          <i class="pi pi-clock" aria-hidden="true"></i>
          {{ song().bpm }} BPM
        </span>
        @if (song().capo) {
          <span class="meta-item">
            <i class="pi pi-angle-up" aria-hidden="true"></i>
            Capo {{ song().capo }}
          </span>
        }
        @if (song().youtube) {
          <span class="meta-item">
            <i class="pi pi-youtube" aria-hidden="true"></i>
            Video
          </span>
        }
      </div>

      @if (song().tags?.length) {
        <div class="tags" aria-label="Etiquetas">
          @for (tag of song().tags; track tag) {
            <span class="tag">{{ tag }}</span>
          }
        </div>
      }

      @if (showDelete()) {
        <button
          class="action-btn"
          (click)="onDelete($event)"
          [attr.aria-label]="'Eliminar ' + song().title"
        >
          <i class="pi pi-trash" aria-hidden="true"></i>
        </button>
      }
    </a>
  `,
})
export class SongCardComponent {
  readonly song = input.required<Song>();
  readonly showDelete = input(false);
  readonly delete = output<string>();

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.delete.emit(this.song().id);
  }
}
