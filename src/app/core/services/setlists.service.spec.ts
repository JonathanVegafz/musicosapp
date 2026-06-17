import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SetlistsService } from './setlists.service';
import { SupabaseService } from './supabase.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockSetlistRow = (overrides = {}) => ({
  id: 'sl-1',
  name: 'Servicio Dominical',
  date: '2025-12-25T10:00:00Z',
  description: 'Navidad',
  created_at: '2024-01-01T00:00:00Z',
  setlist_songs: [],
  setlist_members: [],
  ...overrides,
});

function buildMockSupabase(data: unknown[] = [], error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: data[0] ?? null, error });
  const orderFn = vi.fn().mockResolvedValue({ data, error });
  const selectFn = vi.fn().mockReturnValue({ single, order: orderFn });
  const insertFn = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  const updateFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
  });
  const deleteFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error }),
  });
  const from = vi.fn().mockReturnValue({
    select: selectFn,
    insert: insertFn,
    update: updateFn,
    delete: deleteFn,
  });
  return { client: { from } };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SetlistsService', () => {
  let mockSb: ReturnType<typeof buildMockSupabase>;
  let platformId: string;

  beforeEach(() => {
    mockSb = buildMockSupabase([mockSetlistRow()]);
    platformId = 'browser';
  });

  // Factory providers let each test choose its mock BEFORE the service is
  // instantiated (overrideProvider after inject is illegal in TestBed).
  function setup(): SetlistsService {
    TestBed.configureTestingModule({
      providers: [
        SetlistsService,
        { provide: SupabaseService, useFactory: () => mockSb },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
    return TestBed.inject(SetlistsService);
  }

  // ── init ────────────────────────────────────────────────────────────────────

  describe('init()', () => {
    it('populates setlists signal', async () => {
      const service = setup();
      await service.init();
      expect(service.setlists()).toHaveLength(1);
      expect(service.setlists()[0].name).toBe('Servicio Dominical');
    });

    it('maps snake_case to camelCase', async () => {
      const service = setup();
      await service.init();
      const sl = service.setlists()[0];
      expect(sl.createdAt).toBe('2024-01-01T00:00:00Z');
    });

    it('maps nested setlist_songs and setlist_members', async () => {
      mockSb = buildMockSupabase([
        mockSetlistRow({
          setlist_songs: [{ song_id: 'song-1', order: 1, transposed_key: null, notes: null }],
          setlist_members: [{ id: 'm-1', name: 'Juan', role: 'Guitarra', order: 1 }],
        }),
      ]);
      const service = setup();
      await service.init();

      const sl = service.setlists()[0];
      expect(sl.songs).toHaveLength(1);
      expect(sl.songs[0].songId).toBe('song-1');
      expect(sl.members).toHaveLength(1);
      expect(sl.members[0].name).toBe('Juan');
    });

    it('sets empty array and error message on error', async () => {
      mockSb = buildMockSupabase([], { message: 'error' });
      const service = setup();
      await service.init();
      expect(service.setlists()).toHaveLength(0);
      expect(service.error()).toBe('error');
    });
  });

  // ── upcomingSetlists ─────────────────────────────────────────────────────────

  describe('upcomingSetlists', () => {
    it('returns at most 3 upcoming setlists sorted by date', async () => {
      const rows = Array.from({ length: 5 }, (_, i) =>
        mockSetlistRow({
          id: String(i),
          name: `Setlist ${i}`,
          date: new Date(Date.now() + 86400000 * (i + 1)).toISOString(),
          setlist_songs: [],
          setlist_members: [],
        }),
      );
      mockSb = buildMockSupabase(rows);
      const service = setup();
      await service.init();

      const upcoming = service.upcomingSetlists();
      expect(upcoming.length).toBeLessThanOrEqual(3);
    });

    it('excludes past setlists', async () => {
      mockSb = buildMockSupabase([
        mockSetlistRow({ id: 'past', date: '2020-01-01T00:00:00Z' }),
        mockSetlistRow({ id: 'future', date: new Date(Date.now() + 86400000).toISOString() }),
      ]);
      const service = setup();
      await service.init();

      const upcoming = service.upcomingSetlists();
      expect(upcoming.every((sl) => sl.id !== 'past')).toBe(true);
    });

    it('excludes setlists without date', async () => {
      mockSb = buildMockSupabase([mockSetlistRow({ id: 'no-date', date: null })]);
      const service = setup();
      await service.init();

      expect(service.upcomingSetlists()).toHaveLength(0);
    });
  });

  // ── getById ──────────────────────────────────────────────────────────────────

  describe('getById()', () => {
    let service: SetlistsService;

    beforeEach(async () => {
      service = setup();
      await service.init();
    });

    it('returns setlist when it exists', () => {
      expect(service.getById('sl-1')?.name).toBe('Servicio Dominical');
    });

    it('returns undefined when not found', () => {
      expect(service.getById('nonexistent')).toBeUndefined();
    });
  });
});
