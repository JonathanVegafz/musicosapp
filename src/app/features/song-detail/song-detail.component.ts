import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SongsService } from '../../core/services/songs.service';
import { SetlistsService } from '../../core/services/setlists.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ChordSheetComponent } from '../../shared/components/chord-sheet/chord-sheet.component';
import { TransposeControlComponent } from '../../shared/components/transpose-control/transpose-control.component';
import { FontSizeControlComponent } from '../../shared/components/font-size-control/font-size-control.component';
import { YouTubeEmbedComponent } from '../../shared/components/youtube-embed/youtube-embed.component';
import { ChordViewMode, FontSize } from '../../types';

@Component({
  selector: 'app-song-detail',
  imports: [
    RouterLink,
    NgOptimizedImage,
    ChordSheetComponent,
    TransposeControlComponent,
    FontSizeControlComponent,
    YouTubeEmbedComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './song-detail.component.scss',
  template: `
    @if (song(); as s) {
      <div class="detail">
        <!-- Print-only header (logo + song info); invisible on screen, shown via @media print -->
        <div class="print-only print-header">
          <img ngSrc="/logo_cef.png" width="64" height="64" alt="Logo CEF" class="print-logo" />
          <div class="print-header-text">
            <p class="print-title">{{ s.title }}</p>
            <p class="print-artist">{{ s.artist }}</p>
            <p class="print-meta">
              Tono: {{ s.key }}
              @if (semitones() !== 0) {
                (transportado {{ semitones() > 0 ? '+' : '' }}{{ semitones() }})
              }
              · {{ s.bpm }} BPM
              @if (s.capo) { · Capo {{ s.capo }} }
            </p>
          </div>
        </div>

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
              [class.active]="viewMode() === 'both'"
              (click)="viewMode.set('both')"
              aria-label="Letra con acordes"
              [attr.aria-pressed]="viewMode() === 'both'"
            >
              Letra y acordes
            </button>
            <button
              class="view-btn"
              [class.active]="viewMode() === 'chords'"
              (click)="viewMode.set('chords')"
              aria-label="Solo acordes"
              [attr.aria-pressed]="viewMode() === 'chords'"
            >
              Solo acordes
            </button>
            <button
              class="view-btn"
              [class.active]="viewMode() === 'lyrics'"
              (click)="viewMode.set('lyrics')"
              aria-label="Solo letra"
              [attr.aria-pressed]="viewMode() === 'lyrics'"
            >
              Solo letra
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

          <button
            class="action-btn action-btn-outline"
            (click)="print()"
            aria-label="Imprimir o guardar como PDF"
          >
            <i class="pi pi-print" aria-hidden="true"></i>
            Imprimir / PDF
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

        <!-- Mobile presentation-mode exit FAB (hidden on desktop; controls-bar stays there) -->
        @if (presentationMode()) {
          <button
            #exitFab
            class="presentation-exit-fab"
            type="button"
            (click)="togglePresentation()"
            aria-label="Salir del modo presentación"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
            Salir
          </button>
        }

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
            [mode]="viewMode()"
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
  readonly viewMode = signal<ChordViewMode>('both');
  readonly presentationMode = signal(false);

  private readonly exitFab = viewChild<ElementRef<HTMLButtonElement>>('exitFab');

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

    // Mueve el foco al botón flotante de salida al entrar en modo presentación,
    // ya que en móvil el resto de la barra de controles se oculta con display:none.
    effect(() => {
      if (this.presentationMode()) {
        this.exitFab()?.nativeElement.focus();
      }
    });
  }

  togglePresentation(): void {
    this.presentationMode.update((v) => !v);
  }

  print(): void {
    window.print();
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
