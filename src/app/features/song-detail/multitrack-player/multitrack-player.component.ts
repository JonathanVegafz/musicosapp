import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { unzipSync } from 'fflate';
import { AudioEngineService } from '../../../core/services/audio-engine.service';
import { IndexedDbService } from '../../../core/services/indexed-db.service';
import { MultitrackService } from '../../../core/services/multitrack.service';
import { MixerPreset, Track, TrackType } from '../../../types';
import {
  ExtractedAudio,
  ZipUploadComponent,
} from '../../../shared/components/zip-upload/zip-upload.component';
import { TrackMixerComponent } from '../../../shared/components/track-mixer/track-mixer.component';
import {
  PracticePresetsComponent,
} from '../../../shared/components/practice-presets/practice-presets.component';

function detectTrackType(fileName: string): TrackType {
  const l = fileName.toLowerCase();
  // Mapeo específico del ZIP seed
  if (l.includes('click')) return 'click';
  if (l.includes('bateria')) return 'drums';
  if (l.includes('bajo')) return 'bass';
  if (l.includes('ge-1-y-2')) return 'guitar-electric';
  if (l.includes('acustica')) return 'guitar-acoustic';
  if (l.includes('piano')) return 'keys';
  if (l.includes('synth')) return 'pads';
  if (l.includes('guia')) return 'vocals';
  // Fallback genérico
  if (/drum|bater/.test(l)) return 'drums';
  if (/bass/.test(l)) return 'bass';
  if (/guitar/.test(l)) return 'guitar-electric';
  if (/metron/.test(l)) return 'click';
  if (/key|teclado/.test(l)) return 'keys';
  if (/pad/.test(l)) return 'pads';
  if (/voc|voice|canto/.test(l)) return 'vocals';
  return 'other';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SEED_SONG_ID = 'toda-lengua-toda-nacion';
const SEED_ZIP_PATH = '/multitrack/todalenguaytodanacion.zip';

@Component({
  selector: 'app-multitrack-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZipUploadComponent, TrackMixerComponent, PracticePresetsComponent],
  styles: `
    .player {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    /* Header */
    .player-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s;

      &:hover { background: var(--surface-hover); }
    }

    .player-header.has-tracks {
      border-bottom-color: var(--surface-border);
    }

    .player-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .player-badge {
      font-size: 0.725rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: rgba(167, 139, 250, 0.15);
      color: var(--accent-primary);
      font-weight: 600;
    }

    .chevron {
      color: var(--text-muted);
      font-size: 0.75rem;
      transition: transform 0.2s;
    }

    .chevron.open { transform: rotate(180deg); }

    /* Body */
    .player-body {
      padding: 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Transport */
    .transport {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .progress-bar-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-bar {
      flex: 1;
      height: 4px;
      accent-color: var(--accent-primary);
      cursor: pointer;
    }

    .time-display {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      white-space: nowrap;
    }

    .transport-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .transport-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--surface-border);
      background: var(--surface-overlay);
      color: var(--text-primary);
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;

      &:hover:not(:disabled) {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    .transport-btn.play-btn {
      width: 48px;
      height: 48px;
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: #fff;
      font-size: 1.2rem;

      &:hover:not(:disabled) {
        background: rgba(167, 139, 250, 0.85);
        color: #fff;
      }
    }

    .pitch-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-left: auto;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;

      &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
      &[aria-pressed="true"] {
        background: rgba(167, 139, 250, 0.12);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }
    }

    .pitch-warning {
      font-size: 0.725rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Loading */
    .loading-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: rgba(167, 139, 250, 0.08);
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--surface-border);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Mixer */
    .mixer {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-label {
      font-size: 0.725rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    /* Upload area */
    .upload-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* sr-only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
  `,
  template: `
    <div class="player">
      <!-- Header (toggle) -->
      <div
        class="player-header"
        [class.has-tracks]="hasTracks() && isExpanded()"
        role="button"
        tabindex="0"
        [attr.aria-expanded]="isExpanded()"
        aria-controls="multitrack-body"
        aria-label="Reproductor multitrack"
        (click)="isExpanded.update(v => !v)"
        (keydown.enter)="isExpanded.update(v => !v)"
        (keydown.space)="isExpanded.update(v => !v)"
      >
        <i class="pi pi-sliders-h" aria-hidden="true" style="color:var(--accent-primary)"></i>
        <span class="player-title">Multitrack</span>
        @if (hasTracks()) {
          <span class="player-badge">{{ tracks().length }} pistas</span>
        }
        <i class="pi chevron" [class.open]="isExpanded()" [class]="'pi-chevron-down'" aria-hidden="true"></i>
      </div>

      <!-- Body -->
      @if (isExpanded()) {
        <div class="player-body" id="multitrack-body">

          <!-- Loading banner -->
          @if (isLoadingAudio()) {
            <div class="loading-banner" role="status" aria-live="polite">
              <div class="spinner" aria-hidden="true"></div>
              <span>Cargando tracks de audio…</span>
            </div>
          }

          <!-- Transport (only when tracks loaded) -->
          @if (hasTracks() && !isLoadingAudio()) {
            <div class="transport">
              <div class="progress-bar-wrap">
                <input
                  class="progress-bar"
                  type="range"
                  min="0"
                  max="100"
                  [value]="progressPercent()"
                  (input)="onSeek($event)"
                  aria-label="Progreso de reproducción"
                  [attr.aria-valuenow]="progressPercent()"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
                <span class="time-display" aria-hidden="true">
                  {{ currentTimeDisplay() }} / {{ durationDisplay() }}
                </span>
              </div>

              <div class="transport-controls">
                <!-- Stop -->
                <button
                  class="transport-btn"
                  (click)="audioEngine.stop()"
                  [disabled]="playbackState() === 'stopped'"
                  aria-label="Detener reproducción"
                  title="Stop"
                >
                  <i class="pi pi-stop" aria-hidden="true"></i>
                </button>

                <!-- Play / Pause -->
                <button
                  class="transport-btn play-btn"
                  (click)="onPlayPause()"
                  [attr.aria-label]="playbackState() === 'playing' ? 'Pausar' : 'Reproducir'"
                  [title]="playbackState() === 'playing' ? 'Pausa' : 'Play'"
                >
                  <i
                    class="pi"
                    [class]="playbackState() === 'playing' ? 'pi-pause' : 'pi-play'"
                    aria-hidden="true"
                  ></i>
                </button>

                <!-- Pitch shift toggle -->
                <button
                  class="pitch-toggle"
                  [attr.aria-pressed]="audioEngine.pitchShiftEnabled()"
                  (click)="audioEngine.togglePitchShift()"
                  aria-label="Activar/desactivar transposición de audio"
                  title="Transponer audio junto con acordes"
                >
                  <i class="pi pi-arrows-v" aria-hidden="true"></i>
                  Pitch shift
                </button>
              </div>

              @if (audioEngine.pitchShiftEnabled() && semitones() !== 0) {
                <p class="pitch-warning">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
                  La transposición de audio puede producir una ligera variación de tempo.
                </p>
              }

              <!-- Aria live region for playback state -->
              <span class="sr-only" aria-live="polite" aria-atomic="true">
                @if (playbackState() === 'playing') { Reproduciendo }
                @if (playbackState() === 'paused') { Pausado }
                @if (playbackState() === 'stopped') { Detenido }
              </span>
            </div>
          }

          <!-- Mixer -->
          @if (hasTracks()) {
            <div class="mixer">
              <p class="section-label">Mezcla</p>
              @for (track of tracks(); track track.id) {
                <app-track-mixer
                  [track]="track"
                  (trackChange)="onTrackChange(track.id, $event)"
                />
              }
            </div>

            <!-- Presets -->
            <div>
              <p class="section-label">Práctica</p>
              <app-practice-presets
                [presets]="presets()"
                [activePresetId]="activePresetId()"
                (presetApply)="onPresetApply($event)"
                (presetSave)="onPresetSave($event)"
                (presetDelete)="onPresetDelete($event)"
              />
            </div>

            <!-- Replace tracks -->
            <div class="upload-section">
              <p class="section-label">Reemplazar tracks</p>
              <app-zip-upload
                (filesExtracted)="onFilesExtracted($event)"
                (uploadError)="onUploadError($event)"
              />
            </div>
          } @else if (!isLoadingAudio()) {
            <!-- Empty state: upload -->
            <div class="upload-section">
              <p class="section-label">Cargar multitrack</p>
              <app-zip-upload
                (filesExtracted)="onFilesExtracted($event)"
                (uploadError)="onUploadError($event)"
              />
            </div>
          }

        </div>
      }
    </div>
  `,
})
export class MultitrackPlayerComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly multitrack = inject(MultitrackService);
  readonly audioEngine = inject(AudioEngineService);
  private readonly indexedDb = inject(IndexedDbService);

  readonly songId = input.required<string>();
  readonly semitones = input<number>(0);

  readonly tracks = this.multitrack.tracks;
  readonly presets = this.multitrack.presets;
  readonly hasTracks = this.multitrack.hasTracks;
  readonly playbackState = this.audioEngine.playbackState;

  readonly isExpanded = signal(true);
  readonly isLoadingAudio = signal(false);
  readonly activePresetId = signal<string | null>(null);

  readonly currentTimeDisplay = computed(() => formatTime(this.audioEngine.currentTime()));
  readonly durationDisplay = computed(() => formatTime(this.audioEngine.duration()));
  readonly progressPercent = computed(() => {
    const dur = this.audioEngine.duration();
    return dur > 0 ? (this.audioEngine.currentTime() / dur) * 100 : 0;
  });

  constructor() {
    // Cuando cambia la transposición de acordes, actualizar también el pitch del audio.
    // NO leer pitchShiftEnabled aquí: togglePitchShift() maneja su propio restart.
    effect(() => {
      this.audioEngine.applyDetune(this.semitones());
    });
    // Wire mixer state → audio gain
    effect(() => {
      this.audioEngine.applyMixerState(this.tracks());
    });
  }

  ngOnInit(): void {
    this.multitrack.loadForSong(this.songId());
    if (isPlatformBrowser(this.platformId)) {
      void this.loadAudioFromIndexedDb();
      void this.autoLoadSeedIfNeeded();
    }
  }

  ngOnDestroy(): void {
    this.audioEngine.stop();
  }

  async onPlayPause(): Promise<void> {
    if (this.playbackState() === 'playing') {
      this.audioEngine.pause();
    } else {
      await this.audioEngine.play();
    }
  }

  onSeek(event: Event): void {
    const pct = parseFloat((event.target as HTMLInputElement).value);
    const seconds = (pct / 100) * this.audioEngine.duration();
    this.audioEngine.seek(seconds);
  }

  onTrackChange(trackId: string, changes: Partial<Track>): void {
    this.multitrack.updateTrack(trackId, changes);
  }

  onPresetApply(presetId: string): void {
    this.activePresetId.set(presetId);

    if (presetId === 'full-band') {
      this.tracks().forEach((t) => this.multitrack.updateTrack(t.id, { muted: false, volume: 100, solo: false }));
      return;
    }
    if (presetId === 'sin-guitarra') {
      this.tracks().forEach((t) =>
        this.multitrack.updateTrack(t.id, {
          muted: t.type === 'guitar-electric' || t.type === 'guitar-acoustic',
          solo: false,
        }),
      );
      return;
    }
    if (presetId === 'solo-base') {
      this.tracks().forEach((t) =>
        this.multitrack.updateTrack(t.id, {
          muted: t.type !== 'click' && t.type !== 'drums',
          solo: false,
        }),
      );
      return;
    }
    // Custom preset
    this.multitrack.applyPreset(presetId);
  }

  onPresetSave(name: string): void {
    const trackStates: MixerPreset['trackStates'] = {};
    this.tracks().forEach((t) => {
      trackStates[t.id] = { volume: t.volume, muted: t.muted };
    });
    this.multitrack.savePreset({
      id: crypto.randomUUID(),
      name,
      trackStates,
    });
  }

  onPresetDelete(presetId: string): void {
    if (this.activePresetId() === presetId) this.activePresetId.set(null);
    this.multitrack.deletePreset(presetId);
  }

  async onFilesExtracted(files: ExtractedAudio[]): Promise<void> {
    this.isLoadingAudio.set(true);
    // If replacing, clear previous audio engine state
    this.audioEngine.resetForSong();
    // Remove previous tracks from storage
    await this.indexedDb.deleteBlobsForSong(this.songId());

    await this.handleExtractedFiles(files, /* replace */ true);
    this.isLoadingAudio.set(false);
  }

  onUploadError(_msg: string): void {
    // Error already displayed in ZipUploadComponent
  }

  private async loadAudioFromIndexedDb(): Promise<void> {
    const tracks = this.tracks();
    if (tracks.length === 0) return;
    this.isLoadingAudio.set(true);
    let anyLoaded = false;
    for (const track of tracks) {
      const key = `${this.songId()}_${track.fileName}`;
      const buffer = await this.indexedDb.getBlob(key);
      if (buffer) {
        await this.audioEngine.loadTrack(track.id, buffer);
        anyLoaded = true;
      }
    }
    if (!anyLoaded) {
      // Blobs missing from IndexedDB — clear config so user can re-upload
      this.multitrack.clearForSong(this.songId());
    }
    this.isLoadingAudio.set(false);
  }

  private async autoLoadSeedIfNeeded(): Promise<void> {
    if (this.songId() !== SEED_SONG_ID) return;
    if (this.multitrack.hasTracks()) return;

    this.isLoadingAudio.set(true);
    try {
      const response = await fetch(SEED_ZIP_PATH);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const files = unzipSync(new Uint8Array(arrayBuffer));

      const extracted: ExtractedAudio[] = Object.entries(files)
        .filter(
          ([name]) =>
            /\.(mp3|wav)$/i.test(name) &&
            !name.startsWith('__MACOSX') &&
            !name.split('/').pop()!.startsWith('.'),
        )
        .map(([name, bytes]) => ({
          fileName: name.split('/').pop()!,
          buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
        }));

      await this.handleExtractedFiles(extracted, false);
    } catch {
      // Silent — user can upload manually
    } finally {
      this.isLoadingAudio.set(false);
    }
  }

  private async handleExtractedFiles(files: ExtractedAudio[], replace: boolean): Promise<void> {
    const newTracks: Track[] = [];

    for (const file of files) {
      const trackId = crypto.randomUUID();
      const key = `${this.songId()}_${file.fileName}`;
      await this.indexedDb.saveBlob(key, file.buffer);
      await this.audioEngine.loadTrack(trackId, file.buffer);
      newTracks.push({
        id: trackId,
        name: file.fileName.replace(/\.(mp3|wav)$/i, ''),
        type: detectTrackType(file.fileName),
        fileName: file.fileName,
        volume: 100,
        muted: false,
        solo: false,
      });
    }

    if (replace) {
      this.multitrack.clearForSong(this.songId());
    }
    this.multitrack.addTracks(this.songId(), newTracks);
  }
}
