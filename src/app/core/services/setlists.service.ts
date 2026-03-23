import { computed, inject, Injectable, signal } from '@angular/core';
import { Setlist, SetlistSong } from '../../types';
import { StorageService } from './storage.service';
import { SETLISTS_SEED } from '../data/setlists.seed';

const STORAGE_KEY = 'musicos_setlists';

@Injectable({ providedIn: 'root' })
export class SetlistsService {
  private readonly storage = inject(StorageService);

  readonly setlists = signal<Setlist[]>([]);

  readonly upcomingSetlists = computed(() => {
    const now = new Date();
    return [...this.setlists()]
      .filter((sl) => !sl.date || new Date(sl.date) >= now)
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 3);
  });

  init(): void {
    const stored = this.storage.getAll<Setlist>(STORAGE_KEY);
    this.setlists.set(stored ?? SETLISTS_SEED);
  }

  getById(id: string): Setlist | undefined {
    return this.setlists().find((sl) => sl.id === id);
  }

  create(data: Pick<Setlist, 'name' | 'date' | 'description'>): Setlist {
    const newSetlist: Setlist = {
      ...data,
      id: crypto.randomUUID(),
      songs: [],
      createdAt: new Date().toISOString(),
    };
    this.setlists.update((list) => [newSetlist, ...list]);
    this.persist();
    return newSetlist;
  }

  update(id: string, changes: Partial<Pick<Setlist, 'name' | 'date' | 'description'>>): void {
    this.setlists.update((list) =>
      list.map((sl) => (sl.id === id ? { ...sl, ...changes } : sl)),
    );
    this.persist();
  }

  remove(id: string): void {
    this.setlists.update((list) => list.filter((sl) => sl.id !== id));
    this.persist();
  }

  addSong(setlistId: string, songId: string): void {
    this.setlists.update((list) =>
      list.map((sl) => {
        if (sl.id !== setlistId) return sl;
        const alreadyIn = sl.songs.some((s) => s.songId === songId);
        if (alreadyIn) return sl;
        const newSong: SetlistSong = { songId, order: sl.songs.length + 1 };
        return { ...sl, songs: [...sl.songs, newSong] };
      }),
    );
    this.persist();
  }

  removeSong(setlistId: string, songId: string): void {
    this.setlists.update((list) =>
      list.map((sl) => {
        if (sl.id !== setlistId) return sl;
        const songs = sl.songs
          .filter((s) => s.songId !== songId)
          .map((s, i) => ({ ...s, order: i + 1 }));
        return { ...sl, songs };
      }),
    );
    this.persist();
  }

  reorderSongs(setlistId: string, songs: SetlistSong[]): void {
    this.setlists.update((list) =>
      list.map((sl) => (sl.id === setlistId ? { ...sl, songs } : sl)),
    );
    this.persist();
  }

  private persist(): void {
    this.storage.save(STORAGE_KEY, this.setlists());
  }
}
