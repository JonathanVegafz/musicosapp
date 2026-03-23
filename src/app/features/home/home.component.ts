import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SongsService } from '../../core/services/songs.service';
import { SetlistsService } from '../../core/services/setlists.service';
import { SongCardComponent } from '../../shared/components/song-card/song-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SongCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .home { display: flex; flex-direction: column; gap: 2.5rem; }

    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .hero-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }

    .hero-sub {
      color: var(--text-secondary);
      margin-top: 0.25rem;
      font-size: 0.925rem;
    }

    .hero-actions { display: flex; gap: 0.75rem; }

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

    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.1rem;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.875rem;
      text-decoration: none;
      transition: border-color 0.15s, color 0.15s;
      &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i { color: var(--accent-primary); font-size: 0.9rem; }
    }

    .see-all {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
      &:hover { color: var(--accent-primary); }
    }

    .songs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .setlists-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .setlist-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.1rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: border-color 0.15s, background 0.15s;

      &:hover {
        border-color: rgba(167, 139, 250, 0.4);
        background: var(--surface-overlay);
      }
    }

    .setlist-name {
      font-weight: 600;
      font-size: 0.925rem;
      color: var(--text-primary);
    }

    .setlist-meta {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.15rem;
    }

    .setlist-count {
      background: rgba(167, 139, 250, 0.12);
      color: var(--accent-primary);
      border-radius: var(--radius-sm);
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .empty {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      background: var(--surface-card);
      border: 1px dashed var(--surface-border);
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
    }
  `,
  template: `
    <div class="home">
      <!-- Hero -->
      <div class="hero">
        <div>
          <h1 class="hero-title">Bienvenido 🎵</h1>
          <p class="hero-sub">Tu plataforma de música para la iglesia</p>
        </div>
        <div class="hero-actions">
          <a class="btn-primary" routerLink="/songs/new">
            <i class="pi pi-plus" aria-hidden="true"></i>
            Nueva canción
          </a>
          <a class="btn-outline" routerLink="/library">
            <i class="pi pi-book" aria-hidden="true"></i>
            Biblioteca
          </a>
        </div>
      </div>

      <!-- Próximas setlists -->
      <section aria-label="Próximas setlists">
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-calendar" aria-hidden="true"></i>
            Próximas setlists
          </h2>
          <a class="see-all" routerLink="/setlists">Ver todas</a>
        </div>

        @if (upcomingSetlists().length) {
          <div class="setlists-list">
            @for (sl of upcomingSetlists(); track sl.id) {
              <a class="setlist-card" [routerLink]="['/setlists', sl.id]">
                <div>
                  <div class="setlist-name">{{ sl.name }}</div>
                  <div class="setlist-meta">
                    @if (sl.date) {
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                      {{ formatDate(sl.date) }}
                      &nbsp;·&nbsp;
                    }
                    {{ sl.songs.length }} canciones
                  </div>
                </div>
                <span class="setlist-count">{{ sl.songs.length }}</span>
              </a>
            }
          </div>
        } @else {
          <div class="empty">
            No hay setlists próximas.
            <a routerLink="/setlists" style="color: var(--accent-primary); margin-left: 0.25rem;">Crear una</a>
          </div>
        }
      </section>

      <!-- Canciones recientes -->
      <section aria-label="Canciones añadidas recientemente">
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-star" aria-hidden="true"></i>
            Canciones recientes
          </h2>
          <a class="see-all" routerLink="/library">Ver biblioteca</a>
        </div>

        @if (recentSongs().length) {
          <div class="songs-grid">
            @for (song of recentSongs(); track song.id) {
              <app-song-card [song]="song" />
            }
          </div>
        } @else {
          <div class="empty">
            No hay canciones todavía.
            <a routerLink="/songs/new" style="color: var(--accent-primary); margin-left: 0.25rem;">Crear una</a>
          </div>
        }
      </section>
    </div>
  `,
})
export class HomeComponent {
  private readonly songsService = inject(SongsService);
  private readonly setlistsService = inject(SetlistsService);

  readonly recentSongs = this.songsService.recentSongs;
  readonly upcomingSetlists = this.setlistsService.upcomingSetlists;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
