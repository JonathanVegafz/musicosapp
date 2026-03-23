import { computed, inject, Injectable, signal } from '@angular/core';
import { Song } from '../../types';
import { StorageService } from './storage.service';
import { SONGS_SEED } from '../data/songs.seed';

const STORAGE_KEY = 'musicos_songs';

@Injectable({ providedIn: 'root' })
export class SongsService {
  private readonly storage = inject(StorageService);

  readonly songs = signal<Song[]>([]);

  readonly recentSongs = computed(() =>
    [...this.songs()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  init(): void {
    const stored = this.storage.getAll<Song>(STORAGE_KEY);
    this.songs.set(stored ?? SONGS_SEED);
  }

  getById(id: string): Song | undefined {
    return this.songs().find((s) => s.id === id);
  }

  add(song: Omit<Song, 'id' | 'createdAt'>): Song {
    const newSong: Song = {
      ...song,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.songs.update((list) => [newSong, ...list]);
    this.persist();
    return newSong;
  }

  update(id: string, changes: Partial<Omit<Song, 'id' | 'createdAt'>>): void {
    this.songs.update((list) => list.map((s) => (s.id === id ? { ...s, ...changes } : s)));
    this.persist();
  }

  remove(id: string): void {
    this.songs.update((list) => list.filter((s) => s.id !== id));
    this.persist();
  }

  search(query: string, key?: string): Song[] {
    const q = query.toLowerCase().trim();
    return this.songs().filter((s) => {
      const matchesQuery =
        !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
      const matchesKey = !key || s.key === key;
      return matchesQuery && matchesKey;
    });
  }

  private persist(): void {
    this.storage.save(STORAGE_KEY, this.songs());
  }
}
