import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Setlist, SetlistMember, SetlistSong } from '../../types';
import { SupabaseService } from './supabase.service';
import { toErrorMessage } from '../../shared/utils/error-message';

/** Shape of a row in the Supabase `setlists` table (with nested relations). */
interface SetlistRow {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  created_at: string;
  setlist_songs?: SetlistSongRow[];
  setlist_members?: SetlistMemberRow[];
}

interface SetlistSongRow {
  song_id: string;
  order: number;
  transposed_key: string | null;
  notes: string | null;
}

interface SetlistMemberRow {
  id: string;
  name: string;
  role: string;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class SetlistsService {
  private readonly sb = inject(SupabaseService).client;
  private readonly platformId = inject(PLATFORM_ID);

  readonly setlists = signal<Setlist[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Only setlists with a future date are considered "upcoming".
  readonly upcomingSetlists = computed(() => {
    const now = new Date();
    return [...this.setlists()]
      .filter((sl) => !!sl.date && new Date(sl.date) >= now)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 3);
  });

  async init(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.sb
        .from('setlists')
        .select('*, setlist_songs(*), setlist_members(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.setlists.set((data ?? []).map(mapSetlist));
    } catch (e: unknown) {
      this.error.set(toErrorMessage(e, 'Error al cargar setlists'));
      this.setlists.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getById(id: string): Setlist | undefined {
    return this.setlists().find((sl) => sl.id === id);
  }

  async create(data: Pick<Setlist, 'name' | 'date' | 'description'>): Promise<Setlist> {
    const row = {
      id: crypto.randomUUID(),
      name: data.name,
      date: data.date ?? null,
      description: data.description ?? null,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await this.sb
      .from('setlists')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    const saved: Setlist = { ...mapSetlistRow(inserted), songs: [], members: [] };
    this.setlists.update((list) => [saved, ...list]);
    return saved;
  }

  async update(
    id: string,
    changes: Partial<Pick<Setlist, 'name' | 'date' | 'description'>>,
  ): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.name !== undefined) row['name'] = changes.name;
    if (changes.date !== undefined) row['date'] = changes.date ?? null;
    if (changes.description !== undefined) row['description'] = changes.description ?? null;

    const { data, error } = await this.sb
      .from('setlists')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = mapSetlistRow(data);
    this.setlists.update((list) =>
      list.map((sl) => (sl.id === id ? { ...updated, songs: sl.songs, members: sl.members } : sl)),
    );
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.from('setlists').delete().eq('id', id);
    if (error) throw error;
    this.setlists.update((list) => list.filter((sl) => sl.id !== id));
  }

  async addSong(setlistId: string, songId: string): Promise<void> {
    const setlist = this.setlists().find((sl) => sl.id === setlistId);
    if (!setlist) return;
    if (setlist.songs.some((s) => s.songId === songId)) return;
    const newOrder = setlist.songs.length + 1;
    const { error } = await this.sb.from('setlist_songs').insert({
      setlist_id: setlistId,
      song_id: songId,
      order: newOrder,
    });
    if (error) throw error;
    const newSong: SetlistSong = { songId, order: newOrder };
    this.setlists.update((list) =>
      list.map((sl) =>
        sl.id === setlistId ? { ...sl, songs: [...sl.songs, newSong] } : sl,
      ),
    );
  }

  async removeSong(setlistId: string, songId: string): Promise<void> {
    const setlist = this.setlists().find((sl) => sl.id === setlistId);
    if (!setlist) return;
    const { error } = await this.sb
      .from('setlist_songs')
      .delete()
      .eq('setlist_id', setlistId)
      .eq('song_id', songId);
    if (error) throw error;
    const updatedSongs = setlist.songs
      .filter((s) => s.songId !== songId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    await this._syncOrders(setlistId, updatedSongs);
    this.setlists.update((list) =>
      list.map((sl) => (sl.id === setlistId ? { ...sl, songs: updatedSongs } : sl)),
    );
  }

  async reorderSongs(setlistId: string, songs: SetlistSong[]): Promise<void> {
    await this._syncOrders(setlistId, songs);
    this.setlists.update((list) =>
      list.map((sl) => (sl.id === setlistId ? { ...sl, songs } : sl)),
    );
  }

  async addMember(setlistId: string, name: string, role: string): Promise<void> {
    const setlist = this.setlists().find((sl) => sl.id === setlistId);
    if (!setlist) return;
    const { data, error } = await this.sb
      .from('setlist_members')
      .insert({ setlist_id: setlistId, name, role, order: setlist.members.length + 1 })
      .select()
      .single();
    if (error) throw error;
    const member: SetlistMember = mapSetlistMember(data);
    this.setlists.update((list) =>
      list.map((sl) =>
        sl.id === setlistId ? { ...sl, members: [...sl.members, member] } : sl,
      ),
    );
  }

  async removeMember(setlistId: string, memberId: string): Promise<void> {
    const { error } = await this.sb.from('setlist_members').delete().eq('id', memberId);
    if (error) throw error;
    this.setlists.update((list) =>
      list.map((sl) =>
        sl.id === setlistId
          ? { ...sl, members: sl.members.filter((m) => m.id !== memberId) }
          : sl,
      ),
    );
  }

  private async _syncOrders(setlistId: string, songs: SetlistSong[]): Promise<void> {
    if (!songs.length) return;
    const rows = songs.map((s) => ({
      setlist_id: setlistId,
      song_id: s.songId,
      order: s.order,
    }));
    const { error } = await this.sb
      .from('setlist_songs')
      .upsert(rows, { onConflict: 'setlist_id,song_id' });
    if (error) throw error;
  }
}

function mapSetlist(row: SetlistRow): Setlist {
  return {
    ...mapSetlistRow(row),
    songs: (row.setlist_songs ?? []).map(mapSetlistSong).sort((a, b) => a.order - b.order),
    members: (row.setlist_members ?? []).map(mapSetlistMember).sort((a, b) => a.order - b.order),
  };
}

function mapSetlistRow(row: SetlistRow): Omit<Setlist, 'songs' | 'members'> {
  return {
    id: row.id,
    name: row.name,
    date: row.date ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.created_at,
  };
}

function mapSetlistSong(row: SetlistSongRow): SetlistSong {
  return {
    songId: row.song_id,
    order: row.order,
    transposedKey: row.transposed_key ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function mapSetlistMember(row: SetlistMemberRow): SetlistMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    order: row.order,
  };
}
