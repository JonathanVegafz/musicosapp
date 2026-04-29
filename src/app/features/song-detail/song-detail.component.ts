import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SongsService } from '../../core/services/songs.service';
import { ChordSheetComponent } from '../../shared/components/chord-sheet/chord-sheet.component';
import { TransposeControlComponent } from '../../shared/components/transpose-control/transpose-control.component';
import { FontSizeControlComponent } from '../../shared/components/font-size-control/font-size-control.component';
import { YouTubeEmbedComponent } from '../../shared/components/youtube-embed/youtube-embed.component';
import { MultitrackPlayerComponent } from './multitrack-player/multitrack-player.component';
import { FontSize } from '../../types';

@Component({
  selector: 'app-song-detail',
  imports: [
    RouterLink,
    ChordSheetComponent,
    TransposeControlComponent,
    FontSizeControlComponent,
    YouTubeEmbedComponent,
    MultitrackPlayerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .detail {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Header */
    .header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.825rem;
      transition: color 0.15s;
      width: fit-content;
      &:hover { color: var(--accent-primary); }
    }

    .song-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      line-height: 1.2;
    }

    .song-artist {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .song-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.25rem;
    }

    .meta-chip {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.6rem;
      font-size: 0.775rem;
      color: var(--text-secondary);

      i { color: var(--text-muted); font-size: 0.75rem; }
    }

    /* Controls bar */
    .controls-bar {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      padding: 0.875rem 1.125rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(8px);
    }

    .controls-divider {
      width: 1px;
      height: 24px;
      background: var(--surface-border);
    }

    .controls-spacer { flex: 1; }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.875rem;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: background 0.15s, color 0.15s;
    }

    .action-btn-outline {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--surface-border);
      &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    }

    .action-btn-danger {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid transparent;
      &:hover { border-color: rgba(239, 68, 68, 0.4); color: #ef4444; background: rgba(239, 68, 68, 0.08); }
    }

    .presentation-btn {
      background: rgba(167, 139, 250, 0.12);
      color: var(--accent-primary);
      border: 1px solid rgba(167, 139, 250, 0.25);
      &:hover { background: rgba(167, 139, 250, 0.2); }
    }

    /* Chord sheet panel */
    .sheet-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 1.75rem 2rem;
    }

    /* Presentation mode */
    :host(.presentation-mode) .detail {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: var(--surface-ground);
      padding: 1.5rem 2rem;
      overflow-y: auto;
      gap: 1rem;
    }

    :host(.presentation-mode) .sheet-panel {
      border: none;
      background: transparent;
      padding: 0;
      flex: 1;
    }

    :host(.presentation-mode) .back-btn,
    :host(.presentation-mode) .song-meta {
      display: none;
    }

    /* Not found */
    .not-found {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);

      i { font-size: 3rem; display: block; margin-bottom: 1rem; }
      h2 { font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
    }
  `,
  template: `
    @if (song(); as s) {
      <div class="detail">
        <!-- Back -->
        <a class="back-btn" routerLink="/library">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Biblioteca
        </a>

        <!-- Header -->
        <div class="header">
          <div>
            <h1 class="song-title">{{ s.title }}</h1>
            <p class="song-artist">{{ s.artist }}</p>
          </div>

          <div class="song-meta" aria-label="Información de la canción">
            <span class="meta-chip">
              <i class="pi pi-clock" aria-hidden="true"></i>
              {{ s.bpm }} BPM
            </span>
            @if (s.capo) {
              <span class="meta-chip">
                <i class="pi pi-angle-up" aria-hidden="true"></i>
                Capo {{ s.capo }}
              </span>
            }
            @for (tag of s.tags; track tag) {
              <span class="meta-chip">{{ tag }}</span>
            }
          </div>
        </div>

        <!-- Controls bar -->
        <div class="controls-bar" role="toolbar" aria-label="Controles de la canción">
          <app-transpose-control
            [originalKey]="s.key"
            [semitones]="semitones()"
            (transposeChange)="semitones.set($event)"
          />

          <div class="controls-divider" aria-hidden="true"></div>

          <app-font-size-control
            [current]="fontSize()"
            (sizeChange)="fontSize.set($event)"
          />

          @if (semitones() !== 0) {
            <div class="controls-divider" aria-hidden="true"></div>
            <button
              class="action-btn action-btn-outline"
              (click)="semitones.set(0)"
              aria-label="Resetear transposición al original"
            >
              <i class="pi pi-refresh" aria-hidden="true"></i>
              Original ({{ s.key }})
            </button>
          }

          <div class="controls-spacer"></div>

          <button
            class="action-btn presentation-btn"
            (click)="togglePresentation()"
            [attr.aria-label]="presentationMode() ? 'Salir del modo presentación' : 'Entrar al modo presentación'"
          >
            <i class="pi" [class]="presentationMode() ? 'pi-times' : 'pi-desktop'" aria-hidden="true"></i>
            {{ presentationMode() ? 'Salir' : 'Presentación' }}
          </button>

          <a
            class="action-btn action-btn-outline"
            [routerLink]="['/songs', s.id, 'edit']"
            aria-label="Editar canción"
          >
            <i class="pi pi-pencil" aria-hidden="true"></i>
            Editar
          </a>

          <button
            class="action-btn action-btn-danger"
            (click)="deleteSong(s.id)"
            aria-label="Eliminar canción"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>

        <!-- YouTube -->
        @if (s.youtube) {
          <app-youtube-embed [url]="s.youtube" />
        }

        <!-- Multitrack Player -->
        <app-multitrack-player
          [songId]="s.id"
          [semitones]="semitones()"
        />

        <!-- Chord sheet -->
        <div class="sheet-panel">
          <app-chord-sheet
            [content]="s.content"
            [semitones]="semitones()"
            [fontSize]="fontSize()"
          />
        </div>
      </div>
    } @else {
      <div class="not-found" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        <h2>Canción no encontrada</h2>
        <a routerLink="/library" style="color: var(--accent-primary)">Volver a la biblioteca</a>
      </div>
    }
  `,
  host: {
    '[class.presentation-mode]': 'presentationMode()',
  },
})
export class SongDetailComponent implements OnInit {
  private readonly songsService = inject(SongsService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly song = computed(() => this.songsService.getById(this.id()));
  readonly semitones = signal(0);
  readonly fontSize = signal<FontSize>('normal');
  readonly presentationMode = signal(false);

  ngOnInit(): void {
    this.semitones.set(0);
  }

  togglePresentation(): void {
    this.presentationMode.update((v) => !v);
  }

  deleteSong(id: string): void {
    if (confirm('¿Eliminar esta canción? Esta acción no se puede deshacer.')) {
      this.songsService.remove(id);
      this.router.navigate(['/library']);
    }
  }
}
