import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PitchShifter } from 'soundtouchjs';
import { Track } from '../../types';

/**
 * Tamaño de buffer del ScriptProcessorNode.
 * 4096 = ~93ms latencia a 44.1kHz. Equilibrio entre latencia y rendimiento.
 */
const BUFFER_SIZE = 4096;

@Injectable({ providedIn: 'root' })
export class AudioEngineService {
  private readonly platformId = inject(PLATFORM_ID);

  private ctx: AudioContext | null = null;

  /** AudioBuffers decodificados — se reusan en cada play() */
  private readonly buffers = new Map<string, AudioBuffer>();

  /** GainNodes permanentes por track — controlan volumen/mute/solo */
  private readonly gainNodes = new Map<string, GainNode>();

  /** PitchShifters activos — creados en play(), destruidos en pause()/stop() */
  private readonly shifters = new Map<string, PitchShifter>();

  /** Posición de reproducción en segundos (acumulada en pausa/seek) */
  private offsetAtStart = 0;

  private rafId: number | null = null;
  private currentSemitones = 0;

  readonly playbackState = signal<'stopped' | 'playing' | 'paused'>('stopped');
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly pitchShiftEnabled = signal(false);

  // ─── Carga ───────────────────────────────────────────────────────────────

  async loadTrack(trackId: string, buffer: ArrayBuffer): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.ctx) this.ctx = new AudioContext();

    const audioBuffer = await this.ctx.decodeAudioData(buffer.slice(0));
    this.buffers.set(trackId, audioBuffer);

    if (audioBuffer.duration > this.duration()) {
      this.duration.set(audioBuffer.duration);
    }

    if (!this.gainNodes.has(trackId)) {
      const gain = this.ctx.createGain();
      gain.connect(this.ctx.destination);
      this.gainNodes.set(trackId, gain);
    }
  }

  // ─── Transporte ──────────────────────────────────────────────────────────

  async play(): Promise<void> {
    if (!this.ensureContext() || !this.ctx) return;
    if (this.buffers.size === 0) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.stopAllShifters();

    const semitones = this.pitchShiftEnabled() ? this.currentSemitones : 0;

    for (const [trackId, audioBuffer] of this.buffers) {
      const shifter = new PitchShifter(this.ctx, audioBuffer, BUFFER_SIZE);
      shifter.tempo = 1.0;
      shifter.pitchSemitones = semitones;

      // Seek inicial: posicionar en offsetAtStart
      if (this.offsetAtStart > 0) {
        const pct = (this.offsetAtStart / audioBuffer.duration) * 100;
        shifter.percentagePlayed = Math.min(pct, 99.9);
      }

      const gain = this.gainNodes.get(trackId);
      if (gain) shifter.connect(gain);
      else shifter.connect(this.ctx.destination);

      this.shifters.set(trackId, shifter);
    }

    this.playbackState.set('playing');
    this.startProgressLoop();
  }

  pause(): void {
    if (this.playbackState() !== 'playing') return;

    // Guardar posición actual antes de desconectar
    const firstShifter = [...this.shifters.values()][0];
    if (firstShifter) {
      this.offsetAtStart = firstShifter.timePlayed;
    }

    this.stopAllShifters();
    this.cancelProgressLoop();
    this.playbackState.set('paused');
  }

  stop(): void {
    this.stopAllShifters();
    this.cancelProgressLoop();
    this.offsetAtStart = 0;
    this.currentTime.set(0);
    this.playbackState.set('stopped');
  }

  seek(seconds: number): void {
    const wasPlaying = this.playbackState() === 'playing';
    this.offsetAtStart = Math.max(0, Math.min(seconds, this.duration()));
    this.currentTime.set(this.offsetAtStart);

    if (wasPlaying) {
      this.stopAllShifters();
      this.cancelProgressLoop();
      void this.play();
    }
  }

  // ─── Mezcla ──────────────────────────────────────────────────────────────

  applyMixerState(tracks: Track[]): void {
    if (!this.ctx) return;
    const hasSolo = tracks.some((t) => t.solo);
    for (const track of tracks) {
      const effectiveMuted = track.muted || (hasSolo && !track.solo);
      const gain = this.gainNodes.get(track.id);
      if (!gain) continue;
      const targetVolume = effectiveMuted ? 0 : track.volume / 100;
      gain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.01);
    }
  }

  // ─── Pitch (sin restart, sin drift de tempo) ─────────────────────────────

  /**
   * Llamar cuando cambia la transposición de acordes.
   * Actualiza el pitch de los shifters activos en tiempo real.
   */
  applyDetune(semitones: number): void {
    this.currentSemitones = semitones;
    this.updatePitch();
  }

  togglePitchShift(): void {
    this.pitchShiftEnabled.update((v) => !v);
    this.updatePitch();
  }

  private updatePitch(): void {
    const semitones = this.pitchShiftEnabled() ? this.currentSemitones : 0;
    for (const shifter of this.shifters.values()) {
      shifter.pitchSemitones = semitones;
    }
  }

  // ─── Reset ───────────────────────────────────────────────────────────────

  resetForSong(): void {
    this.stop();
    this.buffers.clear();
    for (const gain of this.gainNodes.values()) gain.disconnect();
    this.gainNodes.clear();
    this.duration.set(0);
    this.currentSemitones = 0;
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private ensureContext(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    if (!this.ctx) this.ctx = new AudioContext();
    return true;
  }

  private stopAllShifters(): void {
    for (const shifter of this.shifters.values()) {
      try {
        shifter.disconnect();
      } catch {
        // ya desconectado
      }
    }
    this.shifters.clear();
  }

  private startProgressLoop(): void {
    this.cancelProgressLoop();
    const tick = () => {
      if (this.playbackState() !== 'playing') return;

      const firstShifter = [...this.shifters.values()][0];
      if (!firstShifter) return;

      this.currentTime.set(Math.min(firstShifter.timePlayed, this.duration()));

      if (firstShifter.percentagePlayed >= 100) {
        this.stop();
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private cancelProgressLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
