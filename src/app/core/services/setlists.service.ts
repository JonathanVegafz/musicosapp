import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Setlist, SetlistMember, SetlistSong } from '../../types';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SetlistsService {
  private readonly sb = inject(SupabaseService).client;
  private readonly platformId = inject(PLATFORM_ID);

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

  async init(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const { data, error } = await this.sb
        .from('setlists')
        .select('*, setlist_songs(*), setlist_members(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.setlists.set((data ?? []).map(mapSetlist));
    } catch {
      this.setlists.set([]);
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
    for (const s of songs) {
      const { error } = await this.sb
        .from('setlist_songs')
        .update({ order: s.order })
        .eq('setlist_id', setlistId)
        .eq('song_id', s.songId);
      if (error) throw error;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSetlist(row: Record<string, any>): Setlist {
  const rawSongs: Record<string, unknown>[] = row['setlist_songs'] ?? [];
  const rawMembers: Record<string, unknown>[] = row['setlist_members'] ?? [];
  return {
    ...mapSetlistRow(row),
    songs: rawSongs.map(mapSetlistSong).sort((a, b) => a.order - b.order),
    members: rawMembers.map(mapSetlistMember).sort((a, b) => a.order - b.order),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSetlistRow(row: Record<string, any>): Omit<Setlist, 'songs' | 'members'> {
  return {
    id: row['id'],
    name: row['name'],
    date: row['date'] ?? undefined,
    description: row['description'] ?? undefined,
    createdAt: row['created_at'],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSetlistSong(row: Record<string, any>): SetlistSong {
  return {
    songId: row['song_id'],
    order: row['order'],
    transposedKey: row['transposed_key'] ?? undefined,
    notes: row['notes'] ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSetlistMember(row: Record<string, any>): SetlistMember {
  return {
    id: row['id'],
    name: row['name'],
    role: row['role'],
    order: row['order'],
  };
}
