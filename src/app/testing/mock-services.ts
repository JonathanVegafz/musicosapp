import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Setlist, Song } from '../types';

/** Builds a Song with sensible defaults for tests. */
export function sampleSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    title: 'Cristo Vive',
    artist: 'Hillsong',
    key: 'G',
    bpm: 120,
    capo: 0,
    content: '[G]Cristo vive',
    createdAt: '2024-01-01T00:00:00Z',
    tags: ['adoración'],
    ...overrides,
  };
}

/** Builds a Setlist with sensible defaults for tests. */
export function sampleSetlist(overrides: Partial<Setlist> = {}): Setlist {
  return {
    id: 'sl-1',
    name: 'Servicio Dominical',
    date: '2025-12-25',
    description: 'Navidad',
    songs: [],
    members: [],
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Stub of SongsService backed by signals; provide via useValue. */
export function mockSongsService(songs: Song[] = []) {
  const list = signal<Song[]>(songs);
  return {
    songs: list,
    recentSongs: signal(songs.slice(0, 5)),
    loading: signal(false),
    error: signal<string | null>(null),
    search: vi.fn((query: string, key?: string) => {
      const q = query.toLowerCase().trim();
      return list().filter((s) => {
        const matchesQuery =
          !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
        return matchesQuery && (!key || s.key === key);
      });
    }),
    getById: vi.fn((id: string) => list().find((s) => s.id === id)),
    add: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

/** Stub of AdminAuthService, pre-unlocked so gated writes proceed; provide via useValue. */
export function mockAdminAuthService() {
  return {
    unlocked: signal(true),
    visible: signal(false),
    errorMsg: signal<string | null>(null),
    requestUnlock: vi.fn().mockResolvedValue(true),
    submit: vi.fn(),
    cancel: vi.fn(),
  };
}

/** Stub of SetlistsService backed by signals; provide via useValue. */
export function mockSetlistsService(setlists: Setlist[] = []) {
  const list = signal<Setlist[]>(setlists);
  return {
    setlists: list,
    upcomingSetlists: signal(setlists.slice(0, 3)),
    loading: signal(false),
    error: signal<string | null>(null),
    getById: vi.fn((id: string) => list().find((s) => s.id === id)),
    create: vi.fn().mockResolvedValue(sampleSetlist()),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    addSong: vi.fn().mockResolvedValue(undefined),
    removeSong: vi.fn().mockResolvedValue(undefined),
    reorderSongs: vi.fn().mockResolvedValue(undefined),
    addMember: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
  };
}
