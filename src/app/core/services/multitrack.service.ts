import { computed, inject, Injectable, signal } from '@angular/core';
import { MixerPreset, MultitrackConfig, Track } from '../../types';
import { StorageService } from './storage.service';

const STORAGE_PREFIX = 'musicos_multitrack_';

@Injectable({ providedIn: 'root' })
export class MultitrackService {
  private readonly storage = inject(StorageService);

  private readonly _config = signal<MultitrackConfig | null>(null);
  readonly config = this._config.asReadonly();
  readonly tracks = computed(() => this._config()?.tracks ?? []);
  readonly presets = computed(() => this._config()?.presets ?? []);
  readonly hasTracks = computed(() => this.tracks().length > 0);

  loadForSong(songId: string): void {
    const stored = this.storage.getItem<MultitrackConfig>(`${STORAGE_PREFIX}${songId}`);
    this._config.set(stored ?? null);
  }

  addTracks(songId: string, newTracks: Track[]): void {
    const current = this._config();
    if (current) {
      this._config.set({ ...current, tracks: [...current.tracks, ...newTracks] });
    } else {
      this._config.set({
        songId,
        tracks: newTracks,
        presets: [],
        updatedAt: new Date().toISOString(),
      });
    }
    this.persist();
  }

  updateTrack(trackId: string, changes: Partial<Track>): void {
    const current = this._config();
    if (!current) return;
    this._config.set({
      ...current,
      tracks: current.tracks.map((t) => (t.id === trackId ? { ...t, ...changes } : t)),
    });
    this.persist();
  }

  removeTrack(trackId: string, songId: string): void {
    const current = this._config();
    if (!current) return;
    const tracks = current.tracks.filter((t) => t.id !== trackId);
    this._config.set({ ...current, tracks });
    if (tracks.length === 0) {
      this.storage.clear(`${STORAGE_PREFIX}${songId}`);
      this._config.set(null);
    } else {
      this.persist();
    }
  }

  savePreset(preset: MixerPreset): void {
    const current = this._config();
    if (!current) return;
    const existing = current.presets.findIndex((p) => p.id === preset.id);
    const presets =
      existing >= 0
        ? current.presets.map((p) => (p.id === preset.id ? preset : p))
        : [...current.presets, preset];
    this._config.set({ ...current, presets });
    this.persist();
  }

  deletePreset(presetId: string): void {
    const current = this._config();
    if (!current) return;
    this._config.set({ ...current, presets: current.presets.filter((p) => p.id !== presetId) });
    this.persist();
  }

  applyPreset(presetId: string): void {
    const current = this._config();
    if (!current) return;
    const preset = current.presets.find((p) => p.id === presetId);
    if (!preset) return;
    const tracks = current.tracks.map((t) => {
      const state = preset.trackStates[t.id];
      return state ? { ...t, volume: state.volume, muted: state.muted } : t;
    });
    this._config.set({ ...current, tracks });
    this.persist();
  }

  clearForSong(songId: string): void {
    this._config.set(null);
    this.storage.clear(`${STORAGE_PREFIX}${songId}`);
  }

  private persist(): void {
    const cfg = this._config();
    if (!cfg) return;
    const updated: MultitrackConfig = { ...cfg, updatedAt: new Date().toISOString() };
    this._config.set(updated);
    this.storage.saveItem(`${STORAGE_PREFIX}${cfg.songId}`, updated);
  }
}
