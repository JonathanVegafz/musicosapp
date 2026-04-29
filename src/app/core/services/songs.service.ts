import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Song } from '../../types';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SongsService {
  private readonly sb = inject(SupabaseService).client;
  private readonly platformId = inject(PLATFORM_ID);

  readonly songs = signal<Song[]>([]);

  readonly recentSongs = computed(() =>
    [...this.songs()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  async init(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const { data, error } = await this.sb
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.songs.set((data ?? []).map(mapSong));
    } catch {
      this.songs.set([]);
    }
  }

  getById(id: string): Song | undefined {
    return this.songs().find((s) => s.id === id);
  }

  async add(song: Omit<Song, 'id' | 'createdAt'>): Promise<Song> {
    const row = {
      ...songToRow(song),
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const { data, error } = await this.sb.from('songs').insert(row).select().single();
    if (error) throw error;
    const saved = mapSong(data);
    this.songs.update((list) => [saved, ...list]);
    return saved;
  }

  async update(id: string, changes: Partial<Omit<Song, 'id' | 'createdAt'>>): Promise<void> {
    const { data, error } = await this.sb
      .from('songs')
      .update(songToRow(changes))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = mapSong(data);
    this.songs.update((list) => list.map((s) => (s.id === id ? updated : s)));
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.from('songs').delete().eq('id', id);
    if (error) throw error;
    this.songs.update((list) => list.filter((s) => s.id !== id));
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSong(row: Record<string, any>): Song {
  return {
    id: row['id'],
    title: row['title'],
    artist: row['artist'],
    key: row['key'],
    bpm: row['bpm'],
    capo: row['capo'],
    youtube: row['youtube'] ?? undefined,
    content: row['content'],
    tags: row['tags'] ?? undefined,
    createdAt: row['created_at'],
  };
}

function songToRow(song: Partial<Omit<Song, 'id' | 'createdAt'>>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (song.title !== undefined) row['title'] = song.title;
  if (song.artist !== undefined) row['artist'] = song.artist;
  if (song.key !== undefined) row['key'] = song.key;
  if (song.bpm !== undefined) row['bpm'] = song.bpm;
  if (song.capo !== undefined) row['capo'] = song.capo;
  if (song.youtube !== undefined) row['youtube'] = song.youtube || null;
  if (song.content !== undefined) row['content'] = song.content;
  if (song.tags !== undefined) row['tags'] = song.tags;
  return row;
}
