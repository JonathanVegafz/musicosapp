import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SongsService } from '../../core/services/songs.service';
import { SetlistsService } from '../../core/services/setlists.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ChordSheetComponent } from '../../shared/components/chord-sheet/chord-sheet.component';
import { TransposeControlComponent } from '../../shared/components/transpose-control/transpose-control.component';
import { FontSizeControlComponent } from '../../shared/components/font-size-control/font-size-control.component';
import { YouTubeEmbedComponent } from '../../shared/components/youtube-embed/youtube-embed.component';
import { FontSize } from '../../types';

@Component({
  selector: 'app-song-detail',
  imports: [
    RouterLink,
    ChordSheetComponent,
    TransposeControlComponent,
    FontSizeControlComponent,
    YouTubeEmbedComponent,
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

    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      background: var(--surface-overlay);
      color: var(--text-secondary);
      font-size: 0.825rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;

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

    .view-toggle {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .view-btn {
      padding: 0.4rem 0.7rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-border);
      background: var(--surface-overlay);
      color: var(--text-secondary);
      font-size: 0.775rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;

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
        @if (setlistId(); as slId) {
          <a class="back-btn" [routerLink]="['/setlists', slId]">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            Volver a la setlist
          </a>
        } @else {
          <a class="back-btn" routerLink="/library">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            Biblioteca
          </a>
        }

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
          @if (setlistId()) {
            <button
              class="nav-btn"
              (click)="goToSong(prevSongId())"
              [disabled]="!prevSongId()"
              aria-label="Canción anterior de la setlist"
            >
              <i class="pi pi-chevron-left" aria-hidden="true"></i>
              Anterior
            </button>
            <button
              class="nav-btn"
              (click)="goToSong(nextSongId())"
              [disabled]="!nextSongId()"
              aria-label="Canción siguiente de la setlist"
            >
              Siguiente
              <i class="pi pi-chevron-right" aria-hidden="true"></i>
            </button>

            <div class="controls-divider" aria-hidden="true"></div>
          }

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

          <div class="controls-divider" aria-hidden="true"></div>

          <div class="view-toggle" role="group" aria-label="Modo de vista">
            <button
              class="view-btn"
              [class.active]="!chordsOnly()"
              (click)="chordsOnly.set(false)"
              aria-label="Letra con acordes"
              [attr.aria-pressed]="!chordsOnly()"
            >
              Letra y acordes
            </button>
            <button
              class="view-btn"
              [class.active]="chordsOnly()"
              (click)="chordsOnly.set(true)"
              aria-label="Solo acordes"
              [attr.aria-pressed]="chordsOnly()"
            >
              Solo acordes
            </button>
          </div>

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

        <!-- Chord sheet -->
        <div class="sheet-panel">
          <app-chord-sheet
            [content]="s.content"
            [semitones]="semitones()"
            [fontSize]="fontSize()"
            [chordsOnly]="chordsOnly()"
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
export class SongDetailComponent {
  private readonly songsService = inject(SongsService);
  private readonly setlistsService = inject(SetlistsService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  readonly id = input.required<string>();
  readonly setlistId = input<string | undefined>(undefined);

  readonly song = computed(() => this.songsService.getById(this.id()));
  readonly semitones = signal(0);
  readonly fontSize = signal<FontSize>('normal');
  readonly chordsOnly = signal(false);
  readonly presentationMode = signal(false);

  private readonly orderedSongIds = computed(() => {
    const sid = this.setlistId();
    const setlist = sid ? this.setlistsService.getById(sid) : undefined;
    return [...(setlist?.songs ?? [])].sort((a, b) => a.order - b.order).map((s) => s.songId);
  });

  private readonly currentIndex = computed(() => this.orderedSongIds().indexOf(this.id()));

  readonly prevSongId = computed(() => {
    const i = this.currentIndex();
    return i > 0 ? this.orderedSongIds()[i - 1] : undefined;
  });

  readonly nextSongId = computed(() => {
    const ids = this.orderedSongIds();
    const i = this.currentIndex();
    return i >= 0 && i < ids.length - 1 ? ids[i + 1] : undefined;
  });

  constructor() {
    effect(() => {
      const s = this.song();
      this.title.setTitle(s ? `${s.title} — MúsicosApp` : 'Canción — MúsicosApp');
    });

    // El router reutiliza esta instancia al navegar entre /songs/:id, así que
    // hay que resetear los controles locales manualmente al cambiar de canción.
    effect(() => {
      this.id();
      this.semitones.set(0);
      this.fontSize.set('normal');
    });
  }

  togglePresentation(): void {
    this.presentationMode.update((v) => !v);
  }

  goToSong(id: string | undefined): void {
    if (!id) return;
    this.router.navigate(['/songs', id], { queryParams: { setlistId: this.setlistId() } });
  }

  async deleteSong(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta canción? Esta acción no se puede deshacer.')) return;
    if (!(await this.adminAuth.requestUnlock())) return;
    await this.songsService.remove(id);
    this.router.navigate(['/library']);
  }
}
