import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { SetlistsService } from '../../core/services/setlists.service';
import { SongsService } from '../../core/services/songs.service';
import { SetlistSong, Song } from '../../types';

interface SetlistEntry {
  setlistSong: SetlistSong;
  song: Song;
}

@Component({
  selector: 'app-setlist-detail',
  imports: [RouterLink, FormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .page { display: flex; flex-direction: column; gap: 1.5rem; }

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

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .setlist-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }

    .setlist-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.3rem;
    }

    .meta-chip {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      i { color: var(--text-muted); font-size: 0.75rem; }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      background: var(--accent-primary);
      color: #0f0f11;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
      &:hover { background: var(--accent-primary-hover); }
    }

    /* Songs list */
    .songs-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .panel-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .drag-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .song-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      transition: background 0.15s;
      cursor: default;

      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-overlay); }
    }

    .drag-handle {
      color: var(--text-muted);
      cursor: grab;
      padding: 0.2rem;
      border-radius: 4px;
      transition: color 0.15s;
      display: flex;
      align-items: center;

      &:hover { color: var(--text-secondary); }
      &:active { cursor: grabbing; }
    }

    .order-num {
      width: 24px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      flex-shrink: 0;
      font-family: var(--font-mono);
    }

    .song-info { flex: 1; min-width: 0; }

    .song-name {
      font-weight: 600;
      font-size: 0.925rem;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .song-artist {
      font-size: 0.775rem;
      color: var(--text-secondary);
      margin-top: 0.1rem;
    }

    .song-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .key-badge {
      background: var(--accent-chord-bg);
      color: var(--accent-chord);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: var(--radius-sm);
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .bpm-badge {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .open-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.35rem 0.75rem;
      background: rgba(167, 139, 250, 0.1);
      color: var(--accent-primary);
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: var(--radius-sm);
      font-size: 0.775rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s;
      &:hover { background: rgba(167, 139, 250, 0.2); }
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      transition: color 0.15s;
      &:hover { color: #ef4444; }
    }

    /* Add songs section */
    .add-section {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .add-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .search-wrap {
      position: relative;

      i {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 0.85rem;
        pointer-events: none;
      }
    }

    .search-input {
      width: 100%;
      padding: 0.6rem 0.75rem 0.6rem 2.25rem;
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
      font-family: var(--font-sans);

      &:focus { border-color: var(--accent-primary); }
      &::placeholder { color: var(--text-muted); }
    }

    .search-results {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 260px;
      overflow-y: auto;
    }

    .result-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      gap: 0.75rem;
    }

    .result-info { flex: 1; min-width: 0; }

    .result-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .result-artist {
      font-size: 0.775rem;
      color: var(--text-secondary);
    }

    .add-btn {
      background: rgba(167, 139, 250, 0.1);
      color: var(--accent-primary);
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.75rem;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s;
      &:hover { background: rgba(167, 139, 250, 0.2); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .empty-songs {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    /* Not found */
    .not-found {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
      i { font-size: 3rem; display: block; margin-bottom: 1rem; }
    }
  `,
  template: `
    @if (setlist(); as sl) {
      <div class="page">
        <a class="back-btn" routerLink="/setlists">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Setlists
        </a>

        <div class="header">
          <div>
            <h1 class="setlist-title">{{ sl.name }}</h1>
            <div class="setlist-meta">
              @if (sl.date) {
                <span class="meta-chip">
                  <i class="pi pi-calendar" aria-hidden="true"></i>
                  {{ formatDate(sl.date) }}
                </span>
              }
              @if (sl.description) {
                <span class="meta-chip">{{ sl.description }}</span>
              }
              <span class="meta-chip">
                <i class="pi pi-music" aria-hidden="true"></i>
                {{ entries().length }} cancion{{ entries().length !== 1 ? 'es' : '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Songs list with drag & drop -->
        <div class="songs-panel" aria-label="Canciones de la setlist">
          <div class="panel-header">
            <span class="panel-title">Canciones</span>
            @if (entries().length > 1) {
              <span class="drag-hint">
                <i class="pi pi-bars" aria-hidden="true"></i>
                Arrastra para reordenar
              </span>
            }
          </div>

          @if (entries().length) {
            <div
              cdkDropList
              (cdkDropListDropped)="onDrop($event)"
              aria-label="Lista de canciones reordenable"
            >
              @for (entry of entries(); track entry.song.id; let i = $index) {
                <div
                  class="song-row"
                  cdkDrag
                  [attr.aria-label]="entry.song.title + ', posición ' + (i + 1)"
                >
                  <span cdkDragHandle class="drag-handle" aria-label="Arrastrar para reordenar">
                    <i class="pi pi-bars" aria-hidden="true"></i>
                  </span>

                  <span class="order-num">{{ i + 1 }}</span>

                  <div class="song-info">
                    <div class="song-name">{{ entry.song.title }}</div>
                    <div class="song-artist">{{ entry.song.artist }}</div>
                  </div>

                  <div class="song-actions">
                    <span class="key-badge">{{ entry.song.key }}</span>
                    <span class="bpm-badge">{{ entry.song.bpm }} BPM</span>

                    <a
                      class="open-btn"
                      [routerLink]="['/songs', entry.song.id]"
                      aria-label="Abrir {{ entry.song.title }}"
                    >
                      <i class="pi pi-arrow-up-right" aria-hidden="true"></i>
                      Abrir
                    </a>

                    <button
                      class="remove-btn"
                      (click)="removeSong(entry.song.id)"
                      [attr.aria-label]="'Quitar ' + entry.song.title + ' de la setlist'"
                    >
                      <i class="pi pi-times" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-songs" role="status">
              Agrega canciones desde la sección de abajo.
            </div>
          }
        </div>

        <!-- Add songs -->
        <div class="add-section" aria-label="Agregar canciones a la setlist">
          <span class="add-title">
            <i class="pi pi-plus-circle" style="color: var(--accent-primary); margin-right: 0.3rem;" aria-hidden="true"></i>
            Agregar canciones
          </span>

          <div class="search-wrap">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              class="search-input"
              type="search"
              placeholder="Buscar canción..."
              [(ngModel)]="addQuery"
              aria-label="Buscar canciones para agregar"
            />
          </div>

          @if (searchResults().length) {
            <div class="search-results" role="list">
              @for (song of searchResults(); track song.id) {
                <div class="result-row" role="listitem">
                  <div class="result-info">
                    <div class="result-name">{{ song.title }}</div>
                    <div class="result-artist">{{ song.artist }} · {{ song.key }}</div>
                  </div>
                  <button
                    class="add-btn"
                    (click)="addSong(song.id)"
                    [disabled]="isInSetlist(song.id)"
                    [attr.aria-label]="isInSetlist(song.id) ? song.title + ' ya está en la setlist' : 'Agregar ' + song.title"
                  >
                    {{ isInSetlist(song.id) ? 'Ya está' : '+ Agregar' }}
                  </button>
                </div>
              }
            </div>
          } @else if (addQuery().length > 0) {
            <p style="font-size: 0.825rem; color: var(--text-muted); text-align: center;">
              No se encontraron canciones.
              <a routerLink="/songs/new" style="color: var(--accent-primary);">Crear una nueva</a>
            </p>
          }
        </div>
      </div>
    } @else {
      <div class="not-found" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">Setlist no encontrada</p>
        <a routerLink="/setlists" style="color: var(--accent-primary);">Volver a setlists</a>
      </div>
    }
  `,
})
export class SetlistDetailComponent {
  private readonly setlistsService = inject(SetlistsService);
  private readonly songsService = inject(SongsService);

  readonly id = input.required<string>();

  readonly setlist = computed(() => this.setlistsService.getById(this.id()));
  readonly addQuery = signal('');

  readonly entries = computed<SetlistEntry[]>(() => {
    const sl = this.setlist();
    if (!sl) return [];
    return [...sl.songs]
      .sort((a, b) => a.order - b.order)
      .reduce<SetlistEntry[]>((acc, ss) => {
        const song = this.songsService.getById(ss.songId);
        if (song) acc.push({ setlistSong: ss, song });
        return acc;
      }, []);
  });

  readonly searchResults = computed(() => {
    const q = this.addQuery().trim();
    if (!q) return this.songsService.songs();
    return this.songsService.search(q);
  });

  isInSetlist(songId: string): boolean {
    return this.setlist()?.songs.some((s) => s.songId === songId) ?? false;
  }

  addSong(songId: string): void {
    this.setlistsService.addSong(this.id(), songId);
  }

  removeSong(songId: string): void {
    this.setlistsService.removeSong(this.id(), songId);
  }

  onDrop(event: CdkDragDrop<SetlistEntry[]>): void {
    const current = [...this.entries()];
    moveItemInArray(current, event.previousIndex, event.currentIndex);
    const reordered: SetlistSong[] = current.map((e, i) => ({
      ...e.setlistSong,
      order: i + 1,
    }));
    this.setlistsService.reorderSongs(this.id(), reordered);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
