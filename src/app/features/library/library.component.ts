import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SongsService } from '../../core/services/songs.service';
import { SongCardComponent } from '../../shared/components/song-card/song-card.component';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
               'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];

@Component({
  selector: 'app-library',
  imports: [RouterLink, FormsModule, SongCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .library { display: flex; flex-direction: column; gap: 1.5rem; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .count {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-muted);
        background: var(--surface-hover);
        border-radius: var(--radius-sm);
        padding: 0.15rem 0.5rem;
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.1rem;
      background: var(--accent-primary);
      color: #0f0f11;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      transition: background 0.15s;
      &:hover { background: var(--accent-primary-hover); }
    }

    .filters {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 200px;

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

      &:focus { border-color: var(--accent-primary); }
      &::placeholder { color: var(--text-muted); }
    }

    .key-select {
      padding: 0.6rem 0.75rem;
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      min-width: 120px;
      cursor: pointer;
      transition: border-color 0.15s;

      &:focus { border-color: var(--accent-primary); }

      option { background: var(--surface-overlay); }
    }

    .results-info {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .songs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .empty {
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-muted);
      background: var(--surface-card);
      border: 1px dashed var(--surface-border);
      border-radius: var(--radius-lg);

      i { font-size: 2rem; margin-bottom: 0.75rem; display: block; }
      p { margin-bottom: 1rem; }
    }

    .clear-btn {
      background: none;
      border: 1px solid var(--surface-border);
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
      &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    }
  `,
  template: `
    <div class="library">
      <div class="page-header">
        <h1 class="page-title">
          Biblioteca
          <span class="count">{{ filteredSongs().length }}</span>
        </h1>
        <a class="btn-primary" routerLink="/songs/new">
          <i class="pi pi-plus" aria-hidden="true"></i>
          Nueva canción
        </a>
      </div>

      <div class="filters" role="search">
        <div class="search-wrap">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input
            class="search-input"
            type="search"
            placeholder="Buscar por título o artista..."
            [(ngModel)]="query"
            aria-label="Buscar canciones"
          />
        </div>

        <select
          class="key-select"
          [(ngModel)]="selectedKey"
          aria-label="Filtrar por tonalidad"
        >
          <option value="">Todas las tonalidades</option>
          @for (key of keys; track key) {
            <option [value]="key">{{ key }}</option>
          }
        </select>

        @if (query() || selectedKey()) {
          <button class="clear-btn" (click)="clearFilters()" aria-label="Limpiar filtros">
            <i class="pi pi-times" aria-hidden="true"></i>
            Limpiar
          </button>
        }
      </div>

      @if (query() || selectedKey()) {
        <p class="results-info">
          {{ filteredSongs().length }} resultado{{ filteredSongs().length !== 1 ? 's' : '' }}
          @if (query()) { para "{{ query() }}" }
          @if (selectedKey()) { en {{ selectedKey() }} }
        </p>
      }

      @if (filteredSongs().length) {
        <div class="songs-grid" role="list" aria-label="Lista de canciones">
          @for (song of filteredSongs(); track song.id) {
            <app-song-card [song]="song" />
          }
        </div>
      } @else {
        <div class="empty" role="status">
          <i class="pi pi-music" aria-hidden="true"></i>
          <p>No se encontraron canciones.</p>
          @if (query() || selectedKey()) {
            <button class="clear-btn" (click)="clearFilters()">Limpiar filtros</button>
          } @else {
            <a class="btn-primary" routerLink="/songs/new" style="display:inline-flex">
              <i class="pi pi-plus" aria-hidden="true"></i>
              Agregar la primera canción
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class LibraryComponent {
  private readonly songsService = inject(SongsService);

  readonly query = signal('');
  readonly selectedKey = signal('');
  readonly keys = KEYS;

  readonly filteredSongs = computed(() =>
    this.songsService.search(this.query(), this.selectedKey() || undefined),
  );

  clearFilters(): void {
    this.query.set('');
    this.selectedKey.set('');
  }
}
